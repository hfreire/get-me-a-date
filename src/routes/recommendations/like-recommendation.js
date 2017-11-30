/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE.md file in the root directory of this source tree.
 */

const { Route } = require('serverful')

const Logger = require('modern-logger')

const Joi = require('joi')
const Boom = require('boom')

const { OutOfLikesError } = require('../../channels')
const Database = require('../../database')
const { Recommendation, Stats, Channel } = require('../../dates')

const like = (recommendation) => {
  const channelName = recommendation.channelName

  return Channel.getByName(channelName)
    .then((channel) => Recommendation.like(channel, recommendation))
    .then((recommendation) => {
      recommendation.isHumanDecision = true
      recommendation.decisionDate = new Date()

      if (recommendation.match) {
        Logger.info(`${recommendation.name} is a :fire:(photos = ${recommendation.photosSimilarityMean}%)`)
      }

      return recommendation
    })
}

const fallInLove = (recommendation) => {
  Recommendation.fallInLove(recommendation)
    .then(() => Stats.updateByDate(new Date()))
    .catch((error) => Logger.error(error))

  return recommendation
}

class LikeRecommendation extends Route {
  constructor () {
    super('POST', '/recommendations/{id}/like', 'Like', 'Like a recommendation')
  }

  handler ({ params = {} }, reply) {
    const { id } = params

    Database.recommendations.findById(id)
      .then((recommendation) => like(recommendation))
      .then((recommendation) => recommendation.save())
      .then((recommendation) => fallInLove(recommendation))
      .then((recommendation) => reply(recommendation))
      .catch(OutOfLikesError, (error) => reply(Boom.tooManyRequests(error.message)))
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
      params: {
        id: Joi.string()
          .required()
          .description('recommendation id')
      }
    }
  }
}

module.exports = new LikeRecommendation()
