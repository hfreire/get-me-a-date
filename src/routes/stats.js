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

const Database = require('../databases')

class Stats extends Route {
  constructor () {
    super('GET', '/stats', 'Stats', 'Returns stats')
  }

  handler ({ query }, reply) {
    const { page = 1, limit = 25 } = query

    Database.Stats.findAll(page, limit)
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
          .description('page number'),
        limit: Joi.string()
          .optional()
          .description('page results limit')
      }
    }
  }
}

module.exports = new Stats()
