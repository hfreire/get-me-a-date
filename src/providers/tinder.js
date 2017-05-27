/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

const FACEBOOK_USER_EMAIL = process.env.FACEBOOK_USER_EMAIL
const FACEBOOK_USER_PASSWORD = process.env.FACEBOOK_USER_PASSWORD
const FACEBOOK_TINDER_APP_AUTHZ_URL = 'https://www.facebook.com/v2.6/dialog/oauth?redirect_uri=fb464891386855067%3A%2F%2Fauthorize%2F&state=%7B%22challenge%22%3A%22q1WMwhvSfbWHvd8xz5PT6lk6eoA%253D%22%2C%220_auth_logger_id%22%3A%2254783C22-558A-4E54-A1EE-BB9E357CC11F%22%2C%22com.facebook.sdk_client_state%22%3Atrue%2C%223_method%22%3A%22sfvc_auth%22%7D&scope=user_birthday%2Cuser_photos%2Cuser_education_history%2Cemail%2Cuser_relationship_details%2Cuser_friends%2Cuser_work_history%2Cuser_likes&response_type=token%2Csigned_request&default_audience=friends&return_scopes=true&auth_type=rerequest&client_id=464891386855067&ret=login&sdk=ios&logger_id=54783C22-558A-4E54-A1EE-BB9E357CC11F#_=_'

const _ = require('lodash')
const Promise = require('bluebird')
const retry = require('bluebird-retry')
const Brakes = require('brakes')

const Health = require('health-checkup')

const { NotAuthorizedError } = require('./errors')

const { TinderClient } = require('tinder')

const { Facebook } = require('../auth')
const { Auth } = require('../database')

const facebookAuthorizeTinderApp = function () {
  return this._facebook.authorizeApp(FACEBOOK_USER_EMAIL, FACEBOOK_USER_PASSWORD, FACEBOOK_TINDER_APP_AUTHZ_URL)
    .then(({ accessToken, facebookUserId }) => {
      return this._tinder.authorizeCircuitBreaker.exec(accessToken, facebookUserId)
        .then(() => {
          const apiToken = this._tinder.getAuthToken()

          return Auth.save('tinder', { provider: 'tinder', api_token: apiToken })
        })
    })
}

const handleError = function (error) {
  switch (error.message) {
    case 'Unauthorized':
      this._tinder.setAuthToken()

      return Auth.deleteByProvider('tinder')
        .then(() => {
          throw new NotAuthorizedError()
        })
    default:
      throw error
  }
}

const defaultOptions = {
  retry: { max_tries: 2, interval: 1000, throw_original: true },
  breaker: { timeout: 5000, threshold: 80, circuitDuration: 3 * 60 * 60 * 1000 }
}

class Tinder {
  constructor (options = {}) {
    this._options = _.defaults(options, defaultOptions)

    this._tinder = Promise.promisifyAll(new TinderClient())
    this._facebook = new Facebook()

    this._breaker = new Brakes(this._options.breaker)

    this._tinder.authorizeCircuitBreaker = this._breaker.slaveCircuit((...params) => retry(() => this._tinder.authorizeAsync(...params), this._options.retry))
    this._tinder.getRecommendationsCircuitBreaker = this._breaker.slaveCircuit((params) => retry(() => this._tinder.getRecommendationsAsync(params), this._options.retry))

    Health.addCheck('tinder', () => new Promise((resolve, reject) => {
      if (this._breaker.isOpen()) {
        return reject(new Error(`circuit breaker is open`))
      } else {
        return resolve()
      }
    }))
  }

  authorize () {
    return Auth.findByProvider('tinder')
      .then((auth) => {
        if (!_.has(auth, 'api_token')) {
          return facebookAuthorizeTinderApp.bind(this)()
        }

        this._tinder.setAuthToken(auth.api_token)
      })
  }

  getRecommendations () {
    return Promise.try(() => {
      if (!this._tinder.getAuthToken()) {
        throw new NotAuthorizedError()
      }
    })
      .then(() => this._tinder.getRecommendationsCircuitBreaker.exec(10))
      .then(({ results }) => results)
      .catch((error) => handleError.bind(this)(error))
  }
}

module.exports = new Tinder()
