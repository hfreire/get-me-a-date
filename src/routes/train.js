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

const Taste = require('../taste')
const Database = require('../database')

class People extends Route {
  constructor () {
    super('POST', '/train/{id}', 'People', 'Returns all people')
  }

  handler (request, reply) {
    const { id } = request.params

    Database.findPeopleById(id)
      .then((person) => {
        if (!person) {
          reply(null)

          return
        }

        const urls = _.map(person.data.photos, 'url')

        return Taste.mentalSnapshot(urls)
          .then(() => {
            return Database.savePeople(person.id, person.like, true, person.provider, person.providerId, person.data)
          })
      })
      .then(() => reply(null))
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
