/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable camelcase */

const HAPPN_FACEBOOK_LOGIN_APP_CLIENT_ID = '247294518656661'
const HAPPN_FACEBOOK_LOGIN_APP_REDIRECT_URI = 'https://www.happn.fr'
const HAPPN_FACEBOOK_LOGIN_APP_OPTIONAL_PARAMS = { scope: 'basic_info', response_type: 'token' }

const Channel = require('./channel')

const _ = require('lodash')
const Promise = require('bluebird')

const { NotAuthorizedError } = require('./errors')

const { HappnWrapper, HappnNotAuthorizedError } = require('happn-wrapper')

const { Channels, Auth } = require('../database')

const findOrAuthorizeHappnIfNeeded = function (channel) {
  return Auth.findById(channel.auth_id)
    .then((auth) => {
      if (!auth) {
        return facebookAuthorizeHappnApp.bind(this)()
          .then(() => {
            const token = this._happn.accessToken

            return Auth.save(undefined, { token })
              .then((auth) => {
                return Channels.save([ channel.name ], { auth_id: auth.id })
                  .then(() => auth)
              })
          })
      }

      return auth
    })
}

const facebookAuthorizeHappnApp = function () {
  return this._facebookLogin.oauthDialog(this._options.oauth.facebook.clientId, this._options.oauth.facebook.redirectUri, this._options.oauth.facebook.optionalParams)
    .then(({ facebookAccessToken }) => this._happn.authorize(facebookAccessToken))
}

const defaultOptions = {
  oauth: {
    facebook: {
      clientId: HAPPN_FACEBOOK_LOGIN_APP_CLIENT_ID,
      redirectUri: HAPPN_FACEBOOK_LOGIN_APP_REDIRECT_URI,
      optionalParams: HAPPN_FACEBOOK_LOGIN_APP_OPTIONAL_PARAMS
    }
  },
  channel: { is_enabled: false }
}

class Happn extends Channel {
  constructor (options = {}) {
    super('happn')

    this._options = _.defaults(options, defaultOptions)

    this._happn = new HappnWrapper()
  }

  authorize () {
    return Channels.findByName(this.name)
      .then((channel) => {
        return findOrAuthorizeHappnIfNeeded.bind(this)(channel)
          .then(({ token }) => {
            this._happn.accessToken = token
          })
      })
  }

  getAccount () {
    return Promise.try(() => {
      if (!this._happn.accessToken) {
        throw new NotAuthorizedError()
      }
    })
      .catch(HappnNotAuthorizedError, () => this.onNotAuthorizedError.bind(this)())
  }

  getRecommendations () {
    return Promise.try(() => {
      if (!this._happn.accessToken) {
        throw new NotAuthorizedError()
      }
    })
      .catch(HappnNotAuthorizedError, () => this.onNotAuthorizedError.bind(this)())
  }

  getUpdates () {
    return Promise.try(() => {
      if (!this._happn.accessToken) {
        throw new NotAuthorizedError()
      }
    })
      .catch(HappnNotAuthorizedError, () => this.onNotAuthorizedError.bind(this)())
  }

  like (userId) {
    if (!userId) {
      return Promise.reject(new Error('invalid arguments'))
    }

    return Promise.try(() => {
      if (!this._happn.accessToken) {
        throw new NotAuthorizedError()
      }
    })
      .catch(HappnNotAuthorizedError, () => this.onNotAuthorizedError.bind(this)())
  }

  getUser (userId) {
    if (!userId) {
      return Promise.reject(new Error('invalid arguments'))
    }

    return Promise.try(() => {
      if (!this._happn.accessToken) {
        throw new NotAuthorizedError()
      }
    })
      .catch(HappnNotAuthorizedError, () => this.onNotAuthorizedError.bind(this)())
  }

  onNotAuthorizedError () {
    this._happn.accessToken = undefined
    this._happn.refreshToken = undefined
    this._happn.userId = undefined

    return super.onNotAuthorizedError()
  }
}

module.exports = new Happn()
