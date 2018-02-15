/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE.md file in the root directory of this source tree.
 */

const FIND_DATES_PERIOD = (process.env.FIND_DATES_PERIOD || 10 * 60) * 1000

const { Serverful } = require('serverful')

const Promise = require('bluebird')

const Logger = require('modern-logger')

const Database = require('./database')
const { Dates } = require('./dates')

const findDates = function () {
  clearTimeout(this._timeout)

  return Dates.find()
    .catch((error) => Logger.error(error))
    .finally(() => {
      this._timeout = setTimeout(() => findDates(), FIND_DATES_PERIOD)
    })
}

class Server extends Serverful {
  start () {
    return Promise.all([ super.start(), Database.start() ])
      .then(() => Dates.start())
      .then(() => {
        if (FIND_DATES_PERIOD > 0) {
          findDates()
        }
      })
  }
}

module.exports = new Server()
