/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

const FIND_DATES_PERIOD = process.env.FIND_DATES_PERIOD || 10 * 60 * 1000

const _ = require('lodash')
const Promise = require('bluebird')

const { Serverful } = require('serverful')

const Logger = require('modern-logger')

const Tinder = require('./providers/tinder')

const Taste = require('./taste')
const Database = require('./database')

const uuidV4 = require('uuid/v4')

const findDates = function () {
  return Tinder.getRecommendations()
    .then(({ results }) => {
      Logger.info(`Got ${results.length} recommendations`)

      return Promise.mapSeries(results, (result) => {
        const { name, photos, _id } = result

        Logger.info(`Started checking ${name} out with ${photos.length} photos`)

        return Promise.props({
          photos: Taste.checkPhotosOut(photos)
        })
          .then(({ photos }) => {
            const meta = {
              id: uuidV4(),
              provider: 'tinder',
              photos: {}
            }

            meta.photos.similarity_mean = _.round(_.mean(_.without(photos, 0, undefined)), 2) || 0

            Logger.info(`${name} face is ${meta.photos.similarity_mean}% similar with target group`)

            meta.like = !_.isEmpty(photos) && meta.photos.similarity_mean > 0

            result.meta = meta

            return Database.savePeople(meta.id, meta.like, false, meta.provider, _id, result)
              .finally(() => Logger.info(`${name} got a ${meta.like ? 'like :+1:' : 'pass :-1:'}`))
          })
          .catch((error) => Logger.warn(error))
      })
    })
}

class Server extends Serverful {
  start () {
    return super.start()
      .then(() => Database.start())
      .then(() => Taste.start())

      .then(() => Tinder.authenticate())
      .then(() => {
        if (FIND_DATES_PERIOD > 0) {
          this.findDates()
        }
      })

  }

  findDates () {
    Logger.info('Started finding dates')

    return findDates.bind(this)()
      .finally(() => {
        Logger.info('Finished finding dates')

        this.timeout = setTimeout(() => this.findDates(), FIND_DATES_PERIOD)
      })
  }
}

module.exports = new Server()
