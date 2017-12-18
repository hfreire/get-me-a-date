/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE.md file in the root directory of this source tree.
 */

const { Route } = require('serverful')

const _ = require('lodash')
const Promise = require('bluebird')

const Joi = require('joi')
const Boom = require('boom')

const Logger = require('modern-logger')

const Database = require('../../database')

class GetRecommendations extends Route {
  constructor () {
    super('GET', '/recommendations', 'Recommendations', 'Returns all recommendations')
  }

  handler ({ query = {} }, reply) {
    const { page = 0, limit = 25, criteria = '{}', select = [], sort = 'lastCheckedOutDate' } = query

    return Promise.try(() => {
      if (criteria) {
        return JSON.parse(criteria)
      }
    })
      .then((criteria) => {
        const offset = page * limit
        const attributes = !_.isEmpty(select) ? select : undefined
        const where = !_.isEmpty(criteria) ? criteria : undefined
        const order = sort ? [ [ sort, 'DESC' ] ] : undefined

        return Database.recommendations.findAndCountAll({ offset, limit, attributes, where, order })
      })
      .then(({ rows, count }) => reply({ results: rows, totalCount: count }))
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
