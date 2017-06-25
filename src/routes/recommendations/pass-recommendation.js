/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

const { Route } = require('serverful')

const Logger = require('modern-logger')

const Joi = require('joi')
const Boom = require('boom')

const { Recommendations } = require('../../database')
const { Recommendation, Stats, Channel } = require('../../dates')

const findById = (channelRecommendationId) => {
  return Recommendations.findById(channelRecommendationId)
    .then((recommendation) => {
      if (!recommendation) {
        throw new Error()
      }

      return recommendation
    })
}

const pass = (recommendation) => {
  const channelName = recommendation.channel
  const channel = Channel.getByName(channelName)

  return Recommendation.pass(channel, recommendation)
    .then((recommendation) => {
      recommendation.is_human_decision = true
      recommendation.decision_date = new Date()

      return recommendation
    })
}

const save = (recommendation) => {
  return Recommendations.save([ recommendation.channel, recommendation.channel_id ], recommendation)
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

  handler (request, reply) {
    const { id } = request.params

    findById(id)
      .then((recommendation) => pass(recommendation))
      .then((recommendation) => save(recommendation))
      .then((recommendation) => couldDoBetter(recommendation))
      .then((recommendation) => reply(recommendation))
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

module.exports = new PassRecommendation()
