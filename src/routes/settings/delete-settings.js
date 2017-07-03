/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

const { Route } = require('serverful')

const Boom = require('boom')

const Logger = require('modern-logger')

const Database = require('../../database')

class UpdateSettings extends Route {
  constructor () {
    super('DELETE', '/settings', 'Settings', 'Update settings')
  }

  handler (request, reply) {
    return Database.settings.destroy({ where: { id: 1 } })
      .then(() => Database.settings.findOrCreate({ where: { id: 1 } }))
      .then((settings) => reply(null, settings[ 0 ]))
      .catch((error) => {
        Logger.error(error)

        reply(Boom.badImplementation(error.message, error))
      })
  }

  auth () {
    return false
  }
}

module.exports = new UpdateSettings()
