/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

const { Route } = require('serverful')

const Promise = require('bluebird')

const Logger = require('modern-logger')

const Joi = require('joi')
const Boom = require('boom')

const { Recommendations } = require('../database')
const { Recommendation } = require('../dates')

class Train extends Route {
  constructor () {
    super('POST', '/train/{id}', 'Train', 'Train a recommendation')
  }

  handler (request, reply) {
    const { id } = request.params

    Recommendations.findById(id)
      .then((recommendation) => {
        if (!recommendation) {
          return Promise.reject(new Error())
        }

        const channelName = recommendation.channel
        const channelRecommendationId = recommendation.channel_id

        return Recommendation.fallInLove(recommendation)
          .then((recommendation) => Recommendations.save(channelName, channelRecommendationId, recommendation))
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
