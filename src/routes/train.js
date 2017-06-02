/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

const { Route } = require('serverful')

const Logger = require('modern-logger')

const Joi = require('join')
const Boom = require('boom')

const Taste = require('../taste')
const { Recommendations } = require('../database')

class Train extends Route {
  constructor () {
    super('POST', '/train/{id}', 'Train', 'Train a recommendation')
  }

  handler (request, reply) {
    const { id } = request.params

    Recommendations.findById(id)
      .then((recommendation) => {
        if (!recommendation) {
          return
        }

        const { channel, channel_id, data } = recommendation
        const { photos } = data
        return Taste.mentalSnapshot(photos)
          .then(() => Recommendations.save(channel, channel_id, { train: true, trained_date: new Date() }))
      })
      .then(() => reply(null))
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
        id: Joi.string()
          .required()
          .description('recommendation id')
      }
    }
  }
}

module.exports = new Train()
