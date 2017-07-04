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

const { Dates } = require('./dates')

const findDates = function () {
  const startDate = _.now()

  Logger.info('Started finding dates')

  return Dates.find()
    .catch((error) => Logger.error(error))
    .finally(() => {
      const stopDate = _.now()
      const duration = _.round((stopDate - startDate) / 1000, 1)

      Logger.info(`Finished finding dates (time = ${duration}s)`)

      this.timeout = setTimeout(() => findDates(), FIND_DATES_PERIOD)
    })
}

class Server extends Serverful {
  start () {
    return Promise.all([ super.start(), Dates.bootstrap() ])
      .then(() => {
        if (FIND_DATES_PERIOD > 0) {
          findDates()
        }
      })
  }
}

module.exports = new Server()
