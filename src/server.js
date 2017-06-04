/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable camelcase */

const FIND_DATES_PERIOD = process.env.FIND_DATES_PERIOD || 10 * 60 * 1000

const { Serverful } = require('serverful')

const _ = require('lodash')
const Promise = require('bluebird')

const Logger = require('modern-logger')

const { Tinder, NotAuthorizedError, OutOfLikesError } = require('./channels')
const Taste = require('./taste')
const { Recommendation, AlreadyCheckedOutEarlierError } = require('./recommendation')
const { SQLite, Recommendations, Channels, Stats } = require('./database')

const findDates = function () {
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

      return Logger.info(`Started finding dates in ${_.capitalize(name)}`)
        .then(() => findDatesByChannel(channel))
        .then(({ received, skipped, failed }) => Logger.info(`Finished finding dates in ${_.capitalize(name)} (received = ${received}, skipped = ${skipped}, failed = ${failed})`))
    })
    .then(() => updateStats(new Date()))
}

const findDatesByChannel = (channel) => {
  let received = 0
  let skipped = 0
  let failed = 0

  return channel.getRecommendations()
    .then((channelRecommendations) => {
      received = channelRecommendations.length

      return Logger.debug(`Got ${received} recommendations from ${_.capitalize(channel.name)}`)
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
    })
    .then(() => { return { received, skipped, failed } })
    .catch(NotAuthorizedError, () => {
      return channel.authorize()
        .then(() => findDatesByChannel(channel))
    })
    .catch((error) => Logger.error(error))
}

const updateStats = (date) => {
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

class Server extends Serverful {
  constructor () {
    super()

    this._channels = {
      'tinder': Tinder
    }
  }

  start () {
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

    return Promise.all([ super.start(), initChannels().then(() => authorizeChannels()), Taste.bootstrap() ])
      .then(() => {
        if (FIND_DATES_PERIOD > 0) {
          this.findDates()
        }
      })
  }

  findDates () {
    const startDate = _.now()

    Logger.info('Started finding dates')

    return findDates.bind(this)()
      .finally(() => {
        const stopDate = _.now()
        const duration = _.round((stopDate - startDate) / 1000, 1)

        Logger.info(`Finished finding dates (time = ${duration}s)`)

        this.timeout = setTimeout(() => this.findDates(), FIND_DATES_PERIOD)
      })
  }
}

module.exports = new Server()
