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

const { Recommendations } = require('../../databases')

class GetRecommendations extends Route {
  constructor () {
    super('GET', '/recommendations', 'Recommendations', 'Returns all recommendations')
  }

  handler ({ query = {} }, reply) {
    const { page = 1, limit = 25, criteria, select, sort } = query

    return Promise.try(() => {
      if (criteria) {
        return JSON.parse(criteria)
      }
    })
      .then((criteria) => Recommendations.findAll(page, limit, criteria, select, sort))
      .then(({ results, totalCount }) => reply({ results, totalCount }))
      .catch((error) => {
        Logger.error(error)

        reply(Boom.badImplementation(error.message, error))
      })
  }

  auth () {
    return false
  }

  plugins () {
    return {
      pagination: {
        enabled: true
      }
    }
  }

  validate () {
    return {
      query: {
        page: Joi.string()
          .optional()
          .description('recommendations page number'),
        limit: Joi.string()
          .optional()
          .description('recommendations page results limit'),
        criteria: Joi.string()
          .optional()
          .description('recommendations statusCriteria'),
        select: Joi.array().single()
          .optional()
          .description('recommendations select'),
        sort: Joi.string()
          .optional()
          .description('recommendations sort')
      }
    }
  }
}

module.exports = new GetRecommendations()
