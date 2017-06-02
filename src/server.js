/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

const FIND_DATES_PERIOD = process.env.FIND_DATES_PERIOD || 10 * 60 * 1000

const { Serverful } = require('serverful')

const _ = require('lodash')
const Promise = require('bluebird')

const Logger = require('modern-logger')

const Tinder = require('./channels/tinder')
const { NotAuthorizedError } = require('./channels/errors')

const Taste = require('./taste')
const { SQLite, Recommendations, Channels, Stats } = require('./database')

const findDates = function () {
  return Channels.findAll()
    .mapSeries(({ name, is_enabled }) => {
      // eslint-disable-next-line camelcase
      if (!is_enabled) {
        return
      }

      return findDatesByChannel.bind(this)(name)
    })
    .then(() => updateStats(new Date()))
}

const updateStats = (date) => {
  return Promise.props({
    likes: Recommendations.findAll(1, 10000, { last_checked_out_date: date, like: 1 }),
    passes: Recommendations.findAll(1, 10000, { last_checked_out_date: date, like: 0 }),
    trains: Recommendations.findAll(1, 10000, { train: 1 })
  })
    .then(({ likes, passes, trains }) => Stats.save(date, {
      likes: likes.totalCount,
      passes: passes.totalCount,
      trains: trains.totalCount
    }))
}

const findDatesByChannel = function (channelName) {
  if (!this._channels[ channelName ]) {
    return Promise.resolve()
  }

  const channel = this._channels[ channelName ]

  return channel.getRecommendations()
    .then((recs) => {
      Logger.info(`Got ${recs.length} recommendations from ${_.capitalize(channelName)}`)

      return Promise.map(recs, (rec) => {
        return checkRecommendationOut(channelName, rec)
          .then(({ recommendation, photos }) => {
            return Promise.resolve()
              .then(() => {
                if (recommendation.like) {
                  return Promise.resolve()
                    .then(() => { recommendation.liked_date = new Date() })
                } else {
                  return Promise.resolve()
                }
              })
              .then(() => Logger.info(`${recommendation.data.name} got a ${recommendation.like ? 'like :+1:' : 'pass :-1:'}(photos = ${recommendation.photos_similarity_mean}%)`))
              .then(() => Recommendations.save(recommendation.channel, recommendation.channel_id, recommendation))
          })
          .catch((error) => Logger.warn(error))
      }, { concurrency: 1 })
    })
    .then(() => channel.getUpdates())
    .catch(NotAuthorizedError, () => channel.authorize())
    .catch((error) => Logger.error(error))
}

const findOrCreateNewRecommendation = (channel, channelId) => {
  return Recommendations.findByChannelAndChannelId(channel, channelId)
    .then((recommendation) => {
      if (!recommendation) {
        return {
          channel,
          channel_id: channelId
        }
      }

      return recommendation
    })
}

const checkRecommendationOut = (channel, rec) => {
  const channelId = rec._id

  return Promise.props({
    recommendation: findOrCreateNewRecommendation(channel, channelId),
    photos: Taste.checkPhotosOut(rec.photos)
  })
    .then(({ recommendation, photos }) => {
      recommendation.last_checked_out_date = new Date()
      recommendation.data = rec
      recommendation.like = photos.like
      recommendation.photos_similarity_mean = photos.faceSimilarityMean

      return { recommendation, photos }
    })
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
