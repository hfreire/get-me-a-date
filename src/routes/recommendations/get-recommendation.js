/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

const { Route } = require('serverful')

const Joi = require('joi')
const Boom = require('boom')

const Logger = require('modern-logger')

const Database = require('../../database')

class GetRecommendation extends Route {
  constructor () {
    super('GET', '/recommendations/{id}', 'Recommendations', 'Returns recommendation by id')
  }

  handler ({ params = {} }, reply) {
    const { id } = params

    return Database.Recommendations.findById(id)
      .then((recommendation) => {
        if (!recommendation) {
          return reply(Boom.notFound())
        }

        reply(recommendation)
      })
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

module.exports = new GetRecommendation()
