/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

const { Route } = require('serverful')

const _ = require('lodash')
const Promise = require('bluebird')

const Logger = require('modern-logger')

const Database = require('../database')

class People extends Route {
  constructor () {
    super('GET', '/people', 'People', 'Returns all people')
  }

  handler ({ query = {} }, reply) {
    const { page = 1, limit = 25, criteria } = query

    return Promise.try(() => {
      if (criteria) {
        return JSON.parse(criteria)
      }
    })
      .then((criteria) => Database.People.findAll(page, limit, criteria))
      .then(({ results, totalCount }) => reply({ results, totalCount }))
      .catch((error) => {
        Logger.error(error)

        reply(error)
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
}

module.exports = new People()
