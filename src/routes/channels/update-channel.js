/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

const { Route } = require('serverful')

const Boom = require('boom')

const Logger = require('modern-logger')

const { Channels } = require('../../database')

const findByName = (channelName) => {
  return Channels.findByName(channelName)
    .then((channel) => {
      if (!channel) {
        throw new Error()
      }

      return channel
    })
}

class UpdateChannel extends Route {
  constructor () {
    super('PUT', '/channels/{name}', 'Channels', 'Update channel')
  }

  handler ({ params = {}, payload }, reply) {
    const { name } = params

    return findByName(name)
      .then(() => JSON.parse(payload))
      .then((channel) => Channels.save([ name ], channel))
      .then((channel) => reply(channel))
      .catch((error) => {
        Logger.error(error)

        reply(Boom.badImplementation(error.message, error))
      })
  }

  auth () {
    return false
  }
}

module.exports = new UpdateChannel()
