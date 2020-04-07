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

const Database = require('../database')

class Stats extends Route {
  constructor() {
    super('GET', '/stats', 'Stats', 'Returns stats')
  }

  handler({ query }, reply) {
    const { page = 1, limit = 25 } = query

    Database.stats.findAndCountAll({
      offset: (page - 1) * limit,
      limit,
      order: [ [ 'date', 'DESC' ] ]
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
      query: Joi.object({
        page: Joi.string()
          .optional()
          .description('page number'),
        limit: Joi.string()
          .optional()
          .description('page results limit')
      })
    }
  }
}

module.exports = new Stats()
