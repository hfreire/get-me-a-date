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

class GetChannels extends Route {
  constructor () {
    super('GET', '/channels', 'Channels', 'Returns all channels')
  }

  handler (request, reply) {
    return Database.channels.findAll()
      .then((channels) => reply(null, channels))
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

module.exports = new GetChannels()
