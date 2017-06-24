/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

const FACEBOOK_USER_EMAIL = process.env.FACEBOOK_USER_EMAIL
const FACEBOOK_USER_PASSWORD = process.env.FACEBOOK_USER_PASSWORD

const _ = require('lodash')
const Promise = require('bluebird')

const Health = require('health-checkup')

const Logger = require('modern-logger')

const FacebookLogin = require('facebook-login-for-robots')

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

    this._facebookLogin = new FacebookLogin({
      facebook: {
        email: FACEBOOK_USER_EMAIL,
        password: FACEBOOK_USER_PASSWORD
      }
    })

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

  findOrAuthorizeIfNeeded (channel, authorize) {
    return Auth.findById(channel.auth_id)
      .then((auth) => {
        if (!auth) {
          const { clientId, redirectUri, optionalParams } = this._options.oauth.facebook

          return Logger.debug(`Started Facebook Login for ${_.capitalize(this.name)} app`)
            .then(() => {
              return this._facebookLogin.oauthDialog(clientId, redirectUri, optionalParams)
                .finally(() => Logger.debug(`Finished Facebook Login for ${_.capitalize(this.name)} app`))
            })
            .then(({ facebookAccessToken, facebookUserId }) => authorize({ facebookAccessToken, facebookUserId }))
            .then(({ token, user_id }) => {
              return Auth.save(undefined, { token })
                .then((auth) => {
                  return Channels.save([ channel.name ], { user_id, auth_id: auth.id })
                    .then(() => {
                      return { user_id, token }
                    })
                })
            })
        }

        return { user_id: channel.user_id, token: auth.token }
      })
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
