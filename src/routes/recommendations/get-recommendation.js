/*
 * Copyright (c) 2020, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE.md file in the root directory of this source tree.
 */

const { Route } = require('serverful')

const Joi = require('@hapi/joi')
const Boom = require('@hapi/boom')

const Logger = require('modern-logger')

const Database = require('../../database')

class GetRecommendation extends Route {
  constructor() {
    super('GET', '/recommendations/{id}', 'Recommendations', 'Returns recommendation by id')
  }

  handler ({ params = {} }, reply) {
    const { id } = params

    Database.recommendations.findById(id)
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

module.exports = new GetRecommendation()
