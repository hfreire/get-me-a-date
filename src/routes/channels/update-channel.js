/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

const { Route } = require('serverful')

const Promise = require('bluebird')

const Joi = require('joi')
const Boom = require('boom')

const Logger = require('modern-logger')

const Database = require('../../database')

class UpdateChannel extends Route {
  constructor () {
    super('PUT', '/channels/{name}', 'Channels', 'Update channel')
  }

  handler ({ params = {}, payload }, reply) {
    const { name } = params

    return Promise.try(() => JSON.parse(payload))
      .then((channel) => Database.channels.update(channel, { where: { name } }))
      .then(() => Database.channels.find({ where: { name } }))
      .then((channel) => reply(channel))
      .catch((error) => {
        Logger.error(error)

        reply(Boom.badImplementation(error.message, error))
      })
  }

  auth () {
    return false
  }

  validate () {
    return {
      params: {
        name: Joi.string()
          .required()
          .description('channel name')
      }
    }
  }
}

module.exports = new UpdateChannel()
