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
const { SQLite, People, Channel, Stats } = require('./database')

const uuidV4 = require('uuid/v4')

const updateStats = (date) => {
  return Promise.props({
    likes: People.findAll(1, 10000, { updated_date: date, like: 1 }),
    passes: People.findAll(1, 10000, { updated_date: date, like: 0 }),
    trains: People.findAll(1, 10000, { train: 1 })
  })
    .then(({ likes, passes, trains }) => Stats.save(date, {
      likes: likes.totalCount,
      passes: passes.totalCount,
      trains: trains.totalCount
    }))
}

const checkRecommendationOut = (provider, rec) => {
  const providerId = rec._id
  const person = {}

  return Promise.props({ photos: Taste.checkPhotosOut(rec.photos) })
    .then(({ photos }) => {
      person.id = uuidV4()
      person.provider = provider
      person.provider_id = providerId
      person.like = photos.like
      person.photos_similarity_mean = photos.faceSimilarityMean
      person.data = rec

      return People.save(provider, providerId, person)
        .then((person) => person)
    })
}

const findDates = function () {
  return Channel.findAll()
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

  return this._channels[ channelName ].getRecommendations()
    .then((recs) => {
      Logger.info(`Got ${recs.length} recommendations from ${_.capitalize(channelName)}`)

      return Promise.map(recs, (rec) => {
        return checkRecommendationOut(channelName, rec)
          .then(({ photos_similarity_mean, data, like }) => {
            // eslint-disable-next-line camelcase
            return Logger.info(`${data.name} got a ${like ? 'like :+1:' : 'pass :-1:'}(photos = ${photos_similarity_mean}%)`)
          })
          .catch((error) => Logger.warn(error))
      }, { concurrency: 5 })
    })
    .catch(NotAuthorizedError, () => this._channels[ channelName ].authorize())
    .catch((error) => Logger.error(error))
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
      return Channel.findAll()
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
