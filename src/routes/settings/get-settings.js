/*
 * Copyright (c) 2020, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE.md file in the root directory of this source tree.
 */

const { Route } = require('serverful')

const Boom = require('@hapi/boom')

const Logger = require('modern-logger')

const Database = require('../../database')

class GetSettings extends Route {
  constructor () {
    super('GET', '/settings', 'Settings', 'Returns settings')
  }

  handler (request, reply) {
    return Database.settings.findOrCreate({ where: { id: 1 } })
      .then((settings) => reply(null, settings[ 0 ]))
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

module.exports = new GetSettings()
