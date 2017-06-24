/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

const _ = require('lodash')
const Promise = require('bluebird')

const Health = require('health-checkup')

const Logger = require('modern-logger')

const { NotAuthorizedError, OutOfLikesError } = require('./errors')

const { Channels, Auth } = require('../database')

const createChannelIfNeeded = function () {
  return Channels.findByName(this.name)
    .then((channel) => {
      if (!channel) {
        const _channel = _.assign({ name: this.name }, this._options.channel)
        return Channels.save([ this.name ], _channel)
      }
    })
}

class Channel {
  constructor (name) {
    this._name = name

    Health.addCheck(this.name, () => new Promise((resolve, reject) => {
      if (this._happn._breaker.isOpen()) {
        return reject(new Error(`circuit breaker is open`))
      } else {
        return resolve()
      }
    }))
  }

  get name () {
    return this._name
  }

  init () {
    return createChannelIfNeeded.bind(this)()
  }

  onNotAuthorizedError () {
    return Logger.debug(`${_.capitalize(this.name)} got unauthorized`)
      .then(() => {
        return Channels.findByName(this.name)
          .then((channel) => {
            return Promise.all([
              Channels.save([ this.name ], { auth_id: channel.auth_id }),
              Auth.deleteById(channel.auth_id)
            ])
          })
          .then(() => {
            throw new NotAuthorizedError()
          })
      })
  }

  onOutOfLikesError () {
    return Logger.debug(`${_.capitalize(this.name)} is out of likes`)
      .then(() => {
        return Channels.save([ this.name ], { is_out_of_likes: true, out_of_likes_date: new Date() })
          .then(() => {
            throw new OutOfLikesError()
          })
      })
  }
}

module.exports = Channel
