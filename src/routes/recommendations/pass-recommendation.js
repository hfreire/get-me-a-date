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
const { Recommendation, Stats, Channel } = require('../../dates')

const pass = (recommendation) => {
  const channelName = recommendation.channelName

  return Channel.getByName(channelName)
    .then((channel) => Recommendation.pass(channel, recommendation))
    .then((recommendation) => {
      recommendation.isHumanDecision = true
      recommendation.decisionDate = new Date()

      return recommendation
    })
}

const couldDoBetter = (recommendation) => {
  Recommendation.couldDoBetter(recommendation)
    .then(() => Stats.updateByDate(new Date()))
    .catch((error) => Logger.error(error))

  return recommendation
}

class PassRecommendation extends Route {
  constructor () {
    super('POST', '/recommendations/{id}/pass', 'Pass', 'Pass a recommendation')
  }

  handler ({ params = {} }, reply) {
    const { id } = params

    Database.recommendations.findById(id)
      .then((recommendation) => pass(recommendation))
      .then((recommendation) => recommendation.save())
      .then((recommendation) => couldDoBetter(recommendation))
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
