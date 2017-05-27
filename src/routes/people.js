/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

const { Route } = require('serverful')

const Logger = require('modern-logger')

const Database = require('../database')

class People extends Route {
  constructor () {
    super('GET', '/people', 'People', 'Returns all people')
  }

  handler (request, reply) {
    Database.People.findAll()
      .then((people) => reply(null, people))
      .catch((error) => {
        Logger.error(error)

        reply(error)
      })
  }

  auth () {
    return false
  }
}

module.exports = new People()
