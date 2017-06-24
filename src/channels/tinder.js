/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable camelcase */

const FACEBOOK_USER_EMAIL = process.env.FACEBOOK_USER_EMAIL
const FACEBOOK_USER_PASSWORD = process.env.FACEBOOK_USER_PASSWORD

const TINDER_FACEBOOK_LOGIN_APP_CLIENT_ID = '464891386855067'
const TINDER_FACEBOOK_LOGIN_APP_REDIRECT_URI = 'fb464891386855067://authorize/'
const TINDER_FACEBOOK_LOGIN_APP_OPTIONAL_PARAMS = {
  state: '{"challenge":"q1WMwhvSfbWHvd8xz5PT6lk6eoA=","0_auth_logger_id":"54783C22-558A-4E54-A1EE-BB9E357CC11F","com.facebook.sdk_client_state":true,"3_method":"sfvc_auth"}',
  scope: 'user_birthday,user_photos,user_education_history,email,user_relationship_details,user_friends,user_work_history,user_likes',
  response_type: 'token,signed_request',
  default_audience: 'friends',
  return_scopes: true,
  auth_type: 'rerequest',
  ret: 'login',
  sdk: 'ios',
  logger_id: '54783C22-558A-4E54-A1EE-BB9E357CC11F#_=_'
}

const Channel = require('./channel')

const _ = require('lodash')
const Promise = require('bluebird')

const { NotAuthorizedError, OutOfLikesError } = require('./errors')

const { TinderWrapper, TinderNotAuthorizedError, TinderOutOfLikesError } = require('tinder-wrapper')

const { Facebook } = require('./auth')
const { Channels, Auth } = require('../database')

const findOrAuthorizeTinderIfNeeded = function (channel) {
  return Auth.findById(channel.auth_id)
    .then((auth) => {
      if (!auth) {
        return facebookAuthorizeTinderApp.bind(this)()
          .then(() => {
            const token = this._tinder.authToken

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

const facebookAuthorizeTinderApp = function () {
  return this._facebook.login(this.name, TINDER_FACEBOOK_LOGIN_APP_CLIENT_ID, TINDER_FACEBOOK_LOGIN_APP_REDIRECT_URI, TINDER_FACEBOOK_LOGIN_APP_OPTIONAL_PARAMS)
    .then(({ facebookAccessToken, facebookUserId }) => this._tinder.authorize(facebookAccessToken, facebookUserId))
}

const defaultOptions = {
  channel: { is_enabled: false }
}

class Tinder extends Channel {
  constructor (options = {}) {
    super('tinder')

    this._options = _.defaults(options, defaultOptions)

    this._tinder = new TinderWrapper()
    this._facebook = new Facebook({ facebook: { email: FACEBOOK_USER_EMAIL, password: FACEBOOK_USER_PASSWORD } })
  }

  authorize () {
    return Channels.findByName(this.name)
      .then((channel) => {
        return findOrAuthorizeTinderIfNeeded.bind(this)(channel)
          .then(({ token }) => {
            this._tinder.authToken = token
          })
      })
  }

  getAccount () {
    return Promise.try(() => {
      if (!this._tinder.authToken) {
        throw new NotAuthorizedError()
      }
    })
      .then(() => this._tinder.getAccount())
      .catch(TinderNotAuthorizedError, () => this.onNotAuthorizedError())
  }

  getRecommendations () {
    return Promise.try(() => {
      if (!this._tinder.authToken) {
        throw new NotAuthorizedError()
      }
    })
      .then(() => this._tinder.getRecommendations())
      .then(({ results }) => results)
      .catch(TinderNotAuthorizedError, () => this.onNotAuthorizedError())
  }

  getUpdates () {
    return Promise.try(() => {
      if (!this._tinder.authToken) {
        throw new NotAuthorizedError()
      }
    })
      .then(() => Channels.findByName(this.name))
      .then(({ last_activity_date }) => {
        const lastActivityDate = !last_activity_date ? undefined : last_activity_date

        return this._tinder.getUpdates(lastActivityDate)
      })
      .then((data) => {
        const last_activity_date = new Date()

        return Channels.save([ this.name ], { last_activity_date })
          .then(() => data)
      })
      .catch(TinderNotAuthorizedError, () => this.onNotAuthorizedError())
  }

  like (userId, photoId, contentHash, sNumber) {
    if (!userId) {
      return Promise.reject(new Error('invalid arguments'))
    }

    return Promise.try(() => {
      if (!this._tinder.authToken) {
        throw new NotAuthorizedError()
      }
    })
      .then(() => {
        return Channels.findByName(this.name)
          .then(({ is_out_of_likes, out_of_likes_date }) => {
            if (is_out_of_likes) {
              if ((_.now() - out_of_likes_date) < 12 * 60 * 60 * 1000) {
                throw new OutOfLikesError()
              } else {
                return Channels.save([ this.name ], { is_out_of_likes: false, out_of_likes_date: null })
              }
            }
          })
      })
      .then(() => {
        return this._tinder.like(userId, photoId, contentHash, sNumber)
          .then(({ match }) => match)
          .catch(TinderOutOfLikesError, () => this.onOutOfLikesError())
      })
      .catch(TinderNotAuthorizedError, () => this.onNotAuthorizedError())
  }

  getUser (userId) {
    if (!userId) {
      return Promise.reject(new Error('invalid arguments'))
    }

    return Promise.try(() => {
      if (!this._tinder.authToken) {
        throw new NotAuthorizedError()
      }
    })
      .then(() => this._tinder.getUser(userId))
      .then(({ results }) => results)
      .catch(TinderNotAuthorizedError, () => this.onNotAuthorizedError.bind(this)())
  }

  onNotAuthorizedError () {
    this._tinder.authToken = undefined

    return super.onNotAuthorizedError()
  }
}

module.exports = new Tinder()
