/*
 * Copyright (c) 2020, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE.md file in the root directory of this source tree.
 */

const { Route } = require('serverful')

const Logger = require('modern-logger')

const Joi = require('@hapi/joi')
const Boom = require('@hapi/boom')

const Database = require('../../database')
const { Recommendation, Channel, AlreadyCheckedOutEarlierError } = require('../../dates')

const checkOut = (recommendation) => {
  const channelName = recommendation.channelName
  const channelRecommendationId = recommendation.channelRecommendationId

  return Channel.getByName(channelName)
    .then((channel) => {
      return channel.getUser(channelRecommendationId)
        .then((channelRecommendation) => Recommendation.checkOut(channel, channelRecommendationId, channelRecommendation))
        .then(({ recommendation }) => recommendation)
        .catch(AlreadyCheckedOutEarlierError, ({ recommendation }) => recommendation)
    })
}

class PassRecommendation extends Route {
  constructor () {
    super('POST', '/recommendations/{id}/checkout', 'Check out', 'Check out a recommendation')
  }

  handler ({ params = {} }, reply) {
    const { id } = params

    Database.recommendations.findById(id)
      .then((recommendation) => checkOut(recommendation))
      .then((recommendation) => recommendation.save())
      .then((recommendation) => reply(recommendation))
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

  validate () {
    return {
      params: Joi.object({
        id: Joi.string()
          .required()
          .description('recommendation id')
      })
    }
  }
}

module.exports = new PassRecommendation()
