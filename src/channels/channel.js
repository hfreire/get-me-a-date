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

const Logger = require('modern-logger')

const FacebookLogin = require('facebook-login-for-robots')

const { NotAuthorizedError, OutOfLikesError } = require('./errors')

const Database = require('../database')

const createChannelIfNeeded = function () {
  return Database.channels.find({ where: { name: this._name } })
    .then((channel) => {
      if (!channel) {
        return Database.channels.create(_.assign({ name: this._name }, this._options.channel))
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
  }

  get name () {
    return this._name
  }

  init () {
    return createChannelIfNeeded.bind(this)()
  }

  findOrAuthorizeIfNeeded (authorize) {
    if (!_.isFunction(authorize)) {
      return Promise.reject(new Error('invalid arguments'))
    }

    return Database.channels.find({ where: { name: this._name } })
      .then((channel) => {
        if (channel.userId && channel.accessToken) {
          return { userId: channel.userId, accessToken: channel.accessToken }
        }

        const { clientId, redirectUri, optionalParams } = this._options.oauth.facebook

        return Logger.debug(`Started Facebook Login for ${_.capitalize(this.name)} channel`)
          .then(() => {
            return this._facebookLogin.oauthDialog(clientId, redirectUri, optionalParams)
              .finally(() => Logger.debug(`Finished Facebook Login for ${_.capitalize(this.name)} channel`))
          })
          .then(({ facebookAccessToken, facebookUserId }) => authorize({ facebookAccessToken, facebookUserId }))
          .then(({ userId, accessToken }) => {
            return Database.channels.update({ userId, accessToken }, { where: { name: this._name } })
              .then(() => { return { userId, accessToken } })
          })
      })
  }

  onNotAuthorizedError () {
    return Logger.debug(`${_.capitalize(this._name)} got unauthorized`)
      .then(() => {
        return Database.channels.update({ accessToken: null }, { where: { name: this._name } })
          .then(() => {
            throw new NotAuthorizedError()
          })
      })
  }

  onOutOfLikesError () {
    return Logger.debug(`${_.capitalize(this.name)} is out of likes`)
      .then(() => {
        return Database.channels.update({
          isOutOfLikes: true,
          outOfLikesDate: new Date()
        }, { where: { name: this._name } })
          .then((d) => {
            throw new OutOfLikesError()
          })
      })
  }
}

module.exports = Channel
