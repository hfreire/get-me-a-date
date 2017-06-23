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

const Logger = require('modern-logger')

const Health = require('health-checkup')

const { NotAuthorizedError, OutOfLikesError } = require('./errors')

const { TinderWrapper, TinderNotAuthorizedError, TinderOutOfLikesError } = require('tinder-wrapper')

const { Facebook } = require('./auth')
const { Channels, Auth } = require('../database')

const createTinderChannelIfNeeded = function () {
  return Channels.findByName(this._options.channel.name)
    .then((channel) => {
      if (!channel) {
        return Channels.save([ this._options.channel.name ], this._options.channel)
      }
    })
}

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
  return this._facebook.authorizeApp(FACEBOOK_USER_EMAIL, FACEBOOK_USER_PASSWORD, FACEBOOK_TINDER_APP_AUTHZ_URL)
    .then(({ accessToken, facebookUserId }) => this._tinder.authorize(accessToken, facebookUserId))
}

const onNotAuthorizedError = function () {
  return Logger.debug(`${_.capitalize(this.name)} got unauthorized`)
    .then(() => {
      this._tinder.authToken = undefined

      return Channels.findByName('tinder')
        .then((channel) => {
          return Promise.all([
            Channels.save([ 'tinder' ], { auth_id: channel.auth_id }),
            Auth.deleteById(channel.auth_id)
          ])
        })
        .then(() => {
          throw new NotAuthorizedError()
        })
    })
}

const onOutOfLikesError = function () {
  return Logger.debug(`${_.capitalize(this.name)} is out of likes`)
    .then(() => {
      return Channels.save([ this.name ], { is_out_of_likes: true, out_of_likes_date: new Date() })
        .then(() => {
          throw new OutOfLikesError()
        })
    })
}

const defaultOptions = {
  channel: { name: 'tinder', is_enabled: false }
}

class Tinder extends Channel {
  constructor (options = {}) {
    super('tinder')

    this._options = _.defaults(options, defaultOptions)

    this._tinder = new TinderWrapper()
    this._facebook = new Facebook()

    Health.addCheck('tinder', () => new Promise((resolve, reject) => {
      if (this._tinder._breaker.isOpen()) {
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
      .catch(TinderNotAuthorizedError, () => onNotAuthorizedError.bind(this)())
  }

  getRecommendations () {
    return Promise.try(() => {
      if (!this._tinder.authToken) {
        throw new NotAuthorizedError()
      }
    })
      .then(() => this._tinder.getRecommendations())
      .then(({ results }) => results)
      .catch(TinderNotAuthorizedError, () => onNotAuthorizedError.bind(this)())
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
      .catch(TinderNotAuthorizedError, () => onNotAuthorizedError.bind(this)())
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
          .catch(TinderOutOfLikesError, () => onOutOfLikesError.bind(this)())
      })
      .catch(TinderNotAuthorizedError, () => onNotAuthorizedError.bind(this)())
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
      .catch(TinderNotAuthorizedError, () => onNotAuthorizedError.bind(this)())
  }
}

module.exports = new Tinder()
