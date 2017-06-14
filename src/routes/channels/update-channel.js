/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

const { Route } = require('serverful')

const Promise = require('bluebird')

const Boom = require('boom')

const { Channels } = require('../../database')

class UpdateChannel extends Route {
  constructor () {
    super('PUT', '/channels/{name}', 'Channels', 'Update channel')
  }

  handler ({ params = {}, payload }, reply) {
    const { name } = params

    return Channels.findByName(name)
      .then((channel) => {
        if (!channel) {
          return reply(null, Boom.notFound())
        }

        return Promise.try(() => JSON.parse(payload))
          .then((payload) => {
            return Channels.save([ name ], payload)
              .then((channel) => reply(null, channel))
          })
      })
  }

  auth () {
    return false
  }
}

module.exports = new UpdateChannel()
