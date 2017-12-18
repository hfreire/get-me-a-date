/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE.md file in the root directory of this source tree.
 */

const { Route } = require('serverful')

const Promise = require('bluebird')

const Boom = require('boom')

const Logger = require('modern-logger')

const Database = require('../../database')

class UpdateSettings extends Route {
  constructor () {
    super('PUT', '/settings', 'Settings', 'Update settings')
  }

  handler ({ payload }, reply) {
    return Promise.try(() => JSON.parse(payload))
      .then((settings) => Database.settings.update(settings, { where: { id: 1 } }))
      .then(() => Database.settings.findById(1))
      .then((settings) => reply(settings))
      .catch((error) => {
        Logger.error(error)

        reply(Boom.badImplementation(error.message, error))
      })
  }

  cors () {
    return true
  }

  auth () {
    return false
  }
}

module.exports = new UpdateSettings()
