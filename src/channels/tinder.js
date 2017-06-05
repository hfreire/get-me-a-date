/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable camelcase */

const FACEBOOK_USER_EMAIL = process.env.FACEBOOK_USER_EMAIL
const FACEBOOK_USER_PASSWORD = process.env.FACEBOOK_USER_PASSWORD
const FACEBOOK_TINDER_APP_AUTHZ_URL = 'https://www.facebook.com/v2.6/dialog/oauth?redirect_uri=fb464891386855067%3A%2F%2Fauthorize%2F&state=%7B%22challenge%22%3A%22q1WMwhvSfbWHvd8xz5PT6lk6eoA%253D%22%2C%220_auth_logger_id%22%3A%2254783C22-558A-4E54-A1EE-BB9E357CC11F%22%2C%22com.facebook.sdk_client_state%22%3Atrue%2C%223_method%22%3A%22sfvc_auth%22%7D&scope=user_birthday%2Cuser_photos%2Cuser_education_history%2Cemail%2Cuser_relationship_details%2Cuser_friends%2Cuser_work_history%2Cuser_likes&response_type=token%2Csigned_request&default_audience=friends&return_scopes=true&auth_type=rerequest&client_id=464891386855067&ret=login&sdk=ios&logger_id=54783C22-558A-4E54-A1EE-BB9E357CC11F#_=_'

const Channel = require('./channel')

const _ = require('lodash')
const Promise = require('bluebird')
const retry = require('bluebird-retry')
const Brakes = require('brakes')

const Logger = require('modern-logger')

const Health = require('health-checkup')

const { NotAuthorizedError, OutOfLikesError } = require('./errors')

const { TinderClient } = require('tinder')

const { Facebook } = require('../auth')
const { Channels, Auth } = require('../database')

const createTinderChannelIfNeeded = function () {
  return Channels.findByName(this._options.channel.name)
    .then((channel) => {
      if (!channel) {
        return Channels.save(this._options.channel.name, this._options.channel)
      }
    })
}

const findOrAuthorizeTinderIfNeeded = function (channel) {
  return Auth.findById(channel.auth_id)
    .then((auth) => {
      if (!auth) {
        return facebookAuthorizeTinderApp.bind(this)()
          .then(() => {
            const token = this._tinder.getAuthToken()

            return Auth.save(undefined, { token })
              .then(({ id }) => Channels.save(channel.name, { auth_id: id }))
          })
      }

      return auth
    })
}

const facebookAuthorizeTinderApp = function () {
  return this._facebook.authorizeApp(FACEBOOK_USER_EMAIL, FACEBOOK_USER_PASSWORD, FACEBOOK_TINDER_APP_AUTHZ_URL)
    .then(({ accessToken, facebookUserId }) => this._tinder.authorizeCircuitBreaker.exec(accessToken, facebookUserId))
}

const handleError = function (error) {
  switch (error.message) {
    case 'Unauthorized':
      return Logger.debug(`${_.capitalize(this.name)} got unauthorized`)
        .then(() => {
          this._tinder.setAuthToken()

          return Channels.findByName('tinder')
            .then((channel) => {
              return Promise.all([
                Channels.save('tinder', { auth_id: channel.auth_id }),
                Auth.deleteById(channel.auth_id)
              ])
            })
            .then(() => {
              throw new NotAuthorizedError()
            })
        })
    case 'Out of likes':
      return Logger.debug(`${_.capitalize(this.name)} is out of likes`)
        .then(() => {
          this._outOfLikesAt = _.now()
          throw new OutOfLikesError()
        })
    default:
      throw error
  }
}

const defaultOptions = {
  channel: { name: 'tinder', is_enabled: false },
  retry: { max_tries: 2, interval: 1000, timeout: 12000, throw_original: true },
  breaker: { timeout: 16000, threshold: 80, circuitDuration: 3 * 60 * 60 * 1000 }
}

class Tinder extends Channel {
  constructor (options = {}) {
    super('tinder')

    this._options = _.defaults(options, defaultOptions)

    this._tinder = Promise.promisifyAll(new TinderClient())
    this._facebook = new Facebook()

    this._breaker = new Brakes(this._options.breaker)

    this._tinder.authorizeCircuitBreaker = this._breaker.slaveCircuit((...params) => retry(() => this._tinder.authorizeAsync(...params), this._options.retry))
    this._tinder.getAccountCircuitBreaker = this._breaker.slaveCircuit(() => retry(() => this._tinder.getAccountAsync(), this._options.retry))
    this._tinder.getRecommendationsCircuitBreaker = this._breaker.slaveCircuit((params) => retry(() => this._tinder.getRecommendationsAsync(params), this._options.retry))
    this._tinder.getUpdatesCircuitBreaker = this._breaker.slaveCircuit((...params) => retry(() => this._tinder.getUpdatesAsync(...params), this._options.retry))
    this._tinder.getHistoryCircuitBreaker = this._breaker.slaveCircuit(() => retry(() => this._tinder.getHistoryAsync(), this._options.retry))
    this._tinder.likeCircuitBreaker = this._breaker.slaveCircuit((...params) => retry(() => this._tinder.likeAsync(...params), this._options.retry))
    this._tinder.getUserCircuitBreaker = this._breaker.slaveCircuit((params) => retry(() => this._tinder.getUserAsync(params), this._options.retry))

    Health.addCheck('tinder', () => new Promise((resolve, reject) => {
      if (this._breaker.isOpen()) {
        return reject(new Error(`circuit breaker is open`))
      } else {
        return resolve()
      }
    }))
  }

  init () {
    return createTinderChannelIfNeeded.bind(this)()
  }

  authorize () {
    return Channels.findByName(this._options.channel.name)
      .then((channel) => {
        return findOrAuthorizeTinderIfNeeded.bind(this)(channel)
          .then(({ token }) => {
            this._tinder.setAuthToken(token)
          })
      })
  }

  getAccount () {
    return Promise.try(() => {
      if (!this._tinder.getAuthToken()) {
        throw new NotAuthorizedError()
      }
    })
      .then(() => this._tinder.getAccountCircuitBreaker.exec())
      .catch((error) => handleError.bind(this)(error))
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

  getUpdates () {
    return Promise.try(() => {
      if (!this._tinder.getAuthToken()) {
        throw new NotAuthorizedError()
      }
    })
      .then(() => Channels.findByName(this.name))
      .then(({ last_activity_date }) => this._tinder.getUpdatesCircuitBreaker.exec(last_activity_date))
      .then((data) => {
        const last_activity_date = new Date()

        return Channels.save(this.name, { last_activity_date })
          .then(() => data)
      })
      .catch((error) => handleError.bind(this)(error))
  }

  getHistory () {
    return Promise.try(() => {
      if (!this._tinder.getAuthToken()) {
        throw new NotAuthorizedError()
      }
    })
      .then(() => this._tinder.getHistoryCircuitBreaker.exec())
      .catch((error) => handleError.bind(this)(error))
  }

  like (userId, photoId, contentHash, sNumber) {
    if (!userId) {
      return Promise.reject(new Error('invalid arguments'))
    }

    if (this._outOfLikesAt) {
      if ((_.now() - this._outOfLikesAt) < 60 * 60 * 1000) {
        throw new OutOfLikesError()
      } else {
        delete this._outOfLikesAt
      }
    }

    return Promise.try(() => {
      if (!this._tinder.getAuthToken()) {
        throw new NotAuthorizedError()
      }
    })
      .then(() => this._tinder.likeCircuitBreaker.exec(userId, photoId, contentHash, sNumber))
      .then(({ match, likes_remaining }) => {
        if (!likes_remaining) {
          throw new Error('Out of likes')
        }

        return match
      })
      .catch((error) => handleError.bind(this)(error))
  }

  getUser (userId) {
    if (!userId) {
      return Promise.reject(new Error('invalid arguments'))
    }

    return Promise.try(() => {
      if (!this._tinder.getAuthToken()) {
        throw new NotAuthorizedError()
      }
    })
      .then(() => this._tinder.getUserCircuitBreaker.exec(userId))
      .then(({ results }) => results)
      .catch((error) => handleError.bind(this)(error))
  }
}

module.exports = new Tinder()
