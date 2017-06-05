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
const { SQLite, Recommendations, Channels, Stats, Messages } = require('../database')

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

const findOrCreateNewRecommendation = (channel, channelRecommendationId) => {
  return Recommendations.findByChannelAndChannelId(channel.name, channelRecommendationId)
    .then((recommendation) => {
      if (!recommendation) {
        return channel.getUser(channelRecommendationId)
          .then((channelRecommendation) => {
            const recommendation = {
              channel: channel.name,
              channel_id: channelRecommendationId,
              data: channelRecommendation
            }

            return Recommendations.save(channel.name, channelRecommendationId, recommendation)
          })
      }

      return recommendation
    })
}

const findOrCreateNewRecommendationFromMatch = (channel, channelRecommendationId, matchId) => {
  return findOrCreateNewRecommendation(channel, channelRecommendationId, matchId)
    .then((recommendation) => {
      if (!recommendation.match) {
        recommendation.like = true
        recommendation.match = true
        recommendation.match_id = matchId

        return Recommendations.save(channel.name, channelRecommendationId, recommendation)
      }

      return recommendation
    })
}

const saveMessages = (channel, accountUserId, recommendationId, messages) => {
  return Promise.try(() => {
    const _messages = []

    _.forEach(messages, ({ _id, message, from, sent_date }) => {
      const _message = {
        channel: channel.name,
        channel_message_id: _id,
        recommendation_id: recommendationId,
        sent_date: new Date(sent_date.replace(/T/, ' ').replace(/\..+/, '')),
        text: message,
        is_from_recommendation: from !== accountUserId
      }
      _messages.push(_message)
    })

    return _messages
  })
    .mapSeries((message) => Messages.save(message.channel, message.channel_message_id, message))
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
        .then(() => this.checkRecommendations(channel))
        .then(({ received, skipped, failed }) => Logger.info(`Finished checking recommendations from ${_.capitalize(channel.name)} (received = ${received}, skipped = ${skipped}, failed = ${failed}`))
    }

    const checkUpdates = function (channel) {
      return Logger.info(`Started checking updates from ${_.capitalize(channel.name)} `)
        .then(() => this.checkUpdates(channel))
        .then(({ matches, messages }) => Logger.info(`Finished checking updates from ${_.capitalize(channel.name)}  (matches = ${matches}, messages = ${messages})`))
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
        /*
         .then(() => Promise.map(channelRecommendations, (channelRecommendation) => {
         return Recommendation.checkOut(channel, channelRecommendation)
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
         return Logger.info(`${data.name} is a :fire: (photos = ${photos_similarity_mean}%)`)
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
         */
      })
      .then(() => { return { received, skipped, failed } })
      .catch(NotAuthorizedError, () => {
        return channel.authorize()
          .then(() => this.checkRecommendations(channel))
      })
      .catch((error) => Logger.error(error))
  }

  checkUpdates (channel) {
    let matches = 0
    let messages = 0

    return findAccount(channel)
      .then(({ user_id }) => {
        const accountUserId = user_id

        return channel.getUpdates()
          .then(({ matches }) => matches)
          .mapSeries((match) => {
            let channelRecommendationId
            if (match.is_new_message) {
              channelRecommendationId = match.messages[ 0 ].from !== accountUserId ? match.messages[ 0 ].from : match.messages[ 0 ].to
            } else {
              matches++
              channelRecommendationId = match.person._id
            }

            messages += match.messages.length

            const matchId = match._id

            return findOrCreateNewRecommendationFromMatch(channel, channelRecommendationId, matchId)
              .then((recommendation) => saveMessages(channel, accountUserId, recommendation.id, match.messages))
          })
      })
      .then(() => { return { matches, messages } })
      .catch(NotAuthorizedError, () => {
        return channel.authorize()
          .then(() => this.checkUpdates(channel))
      })
      .catch((error) => Logger.error(error))
  }

  updateStats (date) {
    return Promise.props({
      likes: Recommendations.findAll(1, 10000, { last_checked_out_date: date, like: 1 }),
      passes: Recommendations.findAll(1, 10000, { last_checked_out_date: date, like: 0 }),
      trains: Recommendations.findAll(1, 10000, { train: 1 }),
      matches: Recommendations.findAll(1, 10000, { last_checked_out_date: date, match: 1 })
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
