/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

const { Route } = require('serverful')

const Logger = require('modern-logger')

const Taste = require('../taste')
const { Recommendations } = require('../database')

class Train extends Route {
  constructor () {
    super('POST', '/train/{id}', 'Recommendations', 'Returns all recommendations')
  }

  handler (request, reply) {
    const { id } = request.params

    Recommendations.findById(id)
      .then((person) => {
        if (!person) {
          reply(null)

          return
        }

        const { provider, provider_id, data } = person
        const { photos } = data
        return Taste.mentalSnapshot(photos)
          .then(() => Recommendations.save(provider, provider_id, { train: true, trained_date: new Date() }))
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

module.exports = new Train()
