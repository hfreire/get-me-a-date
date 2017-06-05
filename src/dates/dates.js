/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable camelcase */

const _ = require('lodash')
const Promise = require('bluebird')

const Logger = require('modern-logger')

const { Tinder } = require('../channels')
const { NotAuthorizedError, OutOfLikesError } = require('../channels')
const { Recommendation, AlreadyCheckedOutEarlierError } = require('../recommendation')
const { SQLite, Recommendations, Channels, Stats } = require('../database')

const { Match } = require('../match')

const findAccount = (channel) => {
  return Channels.findByName(channel.name)
    .then(({ user_id }) => {
      if (!user_id) {
        return channel.getAccount()
          .then(({ user }) => {
            const user_id = user._id

            return Channels.save(channel.name, { user_id })
              .then(() => {
                return { user_id }
              })
          })
      }

      return { user_id }
    })
}

class Dates {
  constructor () {
    this._channels = {
      'tinder': Tinder
    }
  }

  bootstrap () {
    const initChannels = () => {
      return SQLite.start()
        .then(() => Promise.mapSeries(_.keys(this._channels), (name) => this._channels[ name ].init()))
    }

    const authorizeChannels = () => {
      return Channels.findAll()
        .mapSeries(({ name, is_enabled }) => {
          // eslint-disable-next-line camelcase
          if (!is_enabled || !this._channels[ name ]) {
            return
          }

          return this._channels[ name ].authorize()
        })
    }

    return initChannels()
      .then(() => authorizeChannels())
  }

  find () {
    const findByChannel = function (channel) {
      return Logger.info(`Started finding dates in ${_.capitalize(channel.name)}`)
        .then(() => this.findByChannel(channel))
        .finally(() => Logger.info(`Finished finding dates in ${_.capitalize(channel.name)}`))
    }

    return Channels.findAll()
      .mapSeries(({ name, is_enabled }) => {
        // eslint-disable-next-line camelcase
        if (!is_enabled) {
          return
        }

        if (!this._channels[ name ]) {
          return Promise.resolve()
        }

        const channel = this._channels[ name ]

        return findByChannel.bind(this)(channel)
      })
      .then(() => this.updateStats(new Date()))
  }

  findByChannel (channel) {
    const checkRecommendations = function (channel) {
      return Logger.info(`Started checking recommendations from ${_.capitalize(channel.name)} `)
      // .then(() => this.checkRecommendations(channel))
        .then(({ received = 0, skipped = 0, failed = 0 }) => Logger.info(`Finished checking recommendations from ${_.capitalize(channel.name)} (received = ${received}, skipped = ${skipped}, failed = ${failed})`))
    }

    const checkUpdates = function (channel) {
      return Logger.info(`Started checking updates from ${_.capitalize(channel.name)} `)
        .then(() => this.checkUpdates(channel))
        .then(({ matches = 0, messages = 0 }) => Logger.info(`Finished checking updates from ${_.capitalize(channel.name)} (matches = ${matches}, messages = ${messages})`))
    }

    return checkRecommendations.bind(this)(channel)
      .then(() => checkUpdates.bind(this)(channel))
  }

  checkRecommendations (channel) {
    let received = 0
    let skipped = 0
    let failed = 0

    return channel.getRecommendations()
      .then((channelRecommendations) => {
        received = channelRecommendations.length

        return Logger.debug(`Got ${received} recommendations from ${_.capitalize(channel.name)}`)
          .then(() => Promise.map(channelRecommendations, (channelRecommendation) => {
            const channelRecommendationId = channelRecommendation._id

            return Recommendation.checkOut(channel, channelRecommendationId, channelRecommendation)
              .then((recommendation) => {
                return Recommendation.likeOrPass(channel, recommendation)
                  .catch(OutOfLikesError, () => {
                    recommendation.like = 0

                    skipped++

                    return recommendation
                  })
              })
              .then((recommendation) => Recommendations.save(recommendation.channel, recommendation.channel_id, recommendation))
              .then(({ like, photos_similarity_mean, match, data }) => {
                if (match) {
                  return Logger.info(`${data.name} is a :fire:(photos = ${photos_similarity_mean}%)`)
                } else {
                  return Logger.info(`${data.name} got a ${like ? 'like :+1:' : 'pass :-1:'}(photos = ${photos_similarity_mean}%)`)
                }
              })
              .catch(AlreadyCheckedOutEarlierError, () => { skipped++ })
              .catch((error) => {
                failed++

                return Logger.warn(error)
              })
          }, { concurrency: 2 }))
      })
      .then(() => { return { received, skipped, failed } })
      .catch(NotAuthorizedError, () => {
        return channel.authorize()
          .then(() => this.checkRecommendations(channel))
      })
      .catch((error) => Logger.error(error))
  }

  checkUpdates (channel) {
    return findAccount(channel)
      .then(({ user_id }) => {
        const accountUserId = user_id

        return channel.getUpdates()
          .then(({ matches }) => matches)
          .mapSeries((match) => Match.checkLatestNews(channel, accountUserId, match))
          .then((updates) => {
            return _.reduce(updates, (accumulator, update) => {
              accumulator.messages += update.messages
              accumulator.matches += update.matches
              return accumulator
            }, { messages: 0, matches: 0 })
          })
          .catch((error) => Logger.warn(error))
      })
      .catch(NotAuthorizedError, () => {
        return channel.authorize()
          .then(() => this.checkUpdates(channel))
      })
      .catch((error) => Logger.error(error))
  }

  updateStats (date) {
    return Promise.props({
      likes: Recommendations.findAll(1, 10000, { liked_date: date, like: 1 }),
      passes: Recommendations.findAll(1, 10000, { last_checked_out_date: date, like: 0 }),
      trains: Recommendations.findAll(1, 10000, { trained_date: date, train: 1 }),
      matches: Recommendations.findAll(1, 10000, { matched_date: date, match: 1 })
    })
      .then(({ likes, passes, trains, matches }) => Stats.save(date, {
        likes: likes.totalCount,
        passes: passes.totalCount,
        trains: trains.totalCount,
        matches: matches.totalCount
      }))
  }
}

module.exports = new Dates()
