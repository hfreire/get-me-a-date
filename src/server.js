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

const findDatesByChannel = function (channelName) {
  if (!this._channels[ channelName ]) {
    return Promise.resolve()
  }

  const channel = this._channels[ channelName ]

  return channel.getRecommendations()
    .then((channelRecommendations) => {
      Logger.info(`Got ${channelRecommendations.length} recommendations from ${_.capitalize(channelName)}`)

      return Promise.map(channelRecommendations, (channelRecommendation) => {
        return checkRecommendationOut(channel, channelRecommendation)
        // .then((recommendation) => likeOrPassRecommendation(channel, recommendation))
          .then((recommendation) => Recommendations.save(recommendation.channel, recommendation.channel_id, recommendation))
          .then(({ like, photos_similarity_mean, match, data }) => {
            if (match) {
              return Logger.info(`${data.name} is a :fire: (photos = ${photos_similarity_mean}%)`)
            } else {
              return Logger.info(`${data.name} got a ${like ? 'like :+1:' : 'pass :-1:'}(photos = ${photos_similarity_mean}%)`)
            }
          })
          .catch((error) => Logger.warn(error))
      }, { concurrency: 2 })
    })
    .catch(NotAuthorizedError, () => channel.authorize())
    .catch((error) => Logger.error(error))
}

const checkRecommendationOut = (channel, channelRecommendation) => {
  if (!channel || !channelRecommendation) {
    return Promise.reject(new Error('invalid arguments'))
  }

  const channelRecommendationId = channelRecommendation._id

  return Taste.firstSight(channelRecommendation.photos[ 0 ])
    .then(() => findOrCreateNewRecommendation(channel, channelRecommendationId))
    .then((recommendation) => {
      const photosToCheckOut = _.union(_.get(recommendation, 'data.photos', []), channelRecommendation.photos, 'id')

      return Promise.props({
        photos: Taste.checkPhotosOut(photosToCheckOut)
      })
        .then(({ photos }) => {
          recommendation.last_checked_out_date = new Date()
          recommendation.data = channelRecommendation
          recommendation.like = photos.like
          recommendation.photos_similarity_mean = photos.faceSimilarityMean

          return recommendation
        })
    })
}

const findOrCreateNewRecommendation = (channel, channelRecommendationId) => {
  if (!channel || !channelRecommendationId) {
    return Promise.reject(new Error('invalid arguments'))
  }

  const channelName = channel.name

  return Recommendations.findByChannelAndChannelId(channel.name, channelRecommendationId)
    .then((recommendation) => {
      if (!recommendation) {
        return { channel: channelName, channel_id: channelRecommendationId }
      }

      return recommendation
    })
}

const likeOrPassRecommendation = (channel, recommendation) => {
  if (!channel || !recommendation) {
    return Promise.reject(new Error('invalid arguments'))
  }

  return Promise.resolve()
    .then(() => {
      if (recommendation.like) {
        return channel.like(recommendation.channel_id)
          .then(({ match, likes_remaining }) => {
            recommendation.liked_date = new Date()
            recommendation.match = !!match
            if (match) {
              recommendation.match_id = match._id
            }

            return Logger.info(`Likes remaining: ${likes_remaining}`)
          })
          .then(() => recommendation)
      }

      return recommendation
    })
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
