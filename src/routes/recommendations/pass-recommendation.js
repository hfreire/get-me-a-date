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

const { Tinder } = require('../../channels')
const { Recommendations, Channels } = require('../../database')
const { Recommendation, Stats } = require('../../dates')

class PassRecommendation extends Route {
  constructor () {
    super('POST', '/recommendations/{id}/pass', 'Pass', 'Pass a recommendation')
  }

  handler (request, reply) {
    const { id } = request.params

    Recommendations.findById(id)
      .then((recommendation) => {
        if (!recommendation) {
          throw new Error()
        }

        const channelName = recommendation.channel
        const channelRecommendationId = recommendation.channel_id

        return Channels.findByName(channelName)
          .then((channel) => {
            return Recommendation.pass(Tinder, recommendation)
              .then((recommendation) => {
                recommendation.is_human_decision = true
                recommendation.decision_date = new Date()

                return recommendation
              })
          })
          .then((recommendation) => {
            return Recommendations.save([ channelName, channelRecommendationId ], recommendation)
              .then((recommendation) => {
                Recommendation.couldDoBetter(recommendation)
                  .then(() => Stats.updateByDate(new Date()))
                  .catch((error) => Logger.error(error))

                return recommendation
              })
          })
      })
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
