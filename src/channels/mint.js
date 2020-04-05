/*
 * Copyright (c) 2018, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE.md file in the root directory of this source tree.
 */

/* eslint-disable camelcase */

const MINT_FACEBOOK_LOGIN_APP_CLIENT_ID = '577613699038511'
const MINT_FACEBOOK_LOGIN_APP_REDIRECT_URI = 'fbconnect://success'
const MINT_FACEBOOK_LOGIN_APP_OPTIONAL_PARAMS = {
  scope: 'user_birthday,user_education_history,user_friends,email,user_likes,user_photos,user_about_me,user_work_history',
  response_type: 'token,signed_request',
  default_audience: 'friends',
  display: 'touch',
  return_scopes: true,
  sdk: 'android-4.16.1',
  ret: 'login',
  auth_type: 'rerequest'
}

const Channel = require('./channel')

const _ = require('lodash')
const Promise = require('bluebird')

const Health = require('health-checkup')

const { NotAuthorizedError } = require('./errors')

const { MintWrapper, MintNotAuthorizedError } = require('mint-wrapper')

const Database = require('../database')

const defaultOptions = {
  oauth: {
    facebook: {
      clientId: MINT_FACEBOOK_LOGIN_APP_CLIENT_ID,
      redirectUri: MINT_FACEBOOK_LOGIN_APP_REDIRECT_URI,
      optionalParams: MINT_FACEBOOK_LOGIN_APP_OPTIONAL_PARAMS
    }
  },
  channel: { is_enabled: false }
}

class Mint extends Channel {
  constructor (options = {}) {
    super('mint')

    this._options = _.defaults(options, defaultOptions)

    this._mint = new MintWrapper()

    Health.addCheck(this.name, () => new Promise((resolve, reject) => {
      if (this._mint.circuitBreaker.isOpen()) {
        return reject(new Error(`circuit breaker is open`))
      } else {
        return resolve()
      }
    }))
  }

  authorize () {
    const authorize = function ({ facebookAccessToken }) {
      return this._mint.authorize(facebookAccessToken)
        .then(() => {
          return { userId: this._mint.userId, accessToken: this._mint.accessToken }
        })
    }

    return this.findOrAuthorizeIfNeeded(authorize.bind(this))
      .then((channel) => {
        this._mint.userId = channel.userId
        this._mint.accessToken = channel.accessToken
      })
  }

  getRecommendations () {
    return Promise.resolve([])
  }

  getUpdates () {
    const _isNewMatch = (recommendation) => {
      return Database.recommendations.findOne({
        where: {
          channelName: 'mint',
          channelRecommendationId: recommendation.id
        }
      })
        .then((_recommendation) => {
          if (recommendation === null) {
            return true
          }

          if (recommendation.isLike && recommendation.isTheirLike &&
            (!_recommendation.isLike || !_recommendation.isTheirLike)) {
            return true
          }

          return false
        })
    }

    const _getMatch = (channelRecommendationId) => {
      return Promise.try(() => {
        if (!channelRecommendationId) {
          throw new Error('invalid arguments')
        }
      })
        .then(() => this.getUser(channelRecommendationId))
        .delay(1000)
        .then((recommendation) => {
          recommendation.isLike = true
          recommendation.isTheirLike = true
          recommendation.isMatch = true

          return recommendation
        })
    }

    const _getLike = (channelRecommendationId) => {
      return Promise.try(() => {
        if (!channelRecommendationId) {
          throw new Error('invalid arguments')
        }
      })
        .then(() => this.getUser(channelRecommendationId))
        .delay(1000)
        .then((recommendation) => {
          recommendation.isLike = true

          return recommendation
        })
    }

    const _getTheirLike = (channelRecommendationId) => {
      return Promise.try(() => {
        if (!channelRecommendationId) {
          throw new Error('invalid arguments')
        }
      })
        .then(() => this.getUser(channelRecommendationId))
        .delay(1000)
        .then((recommendation) => {
          recommendation.isTheirLike = true

          return recommendation
        })
    }

    const _getUpdates = () => {
      return Database.channels.find({ where: { name: this._name } })
        .then(({ lastActivityDate, userId }) => {
          return this._mint.getUpdates(lastActivityDate)
            .then(({ favorites, admirers, chats }) => {
              return Database.channels.update({ lastActivityDate: new Date() }, { where: { name: this._name } })
                .then(() => {
                  const matches = _.intersectionBy(_.get(favorites, 'added', []), _.get(admirers, 'added', []), 'id')
                  const likes = _.differenceBy(_.get(favorites, 'added', []), _.get(admirers, 'added', []), 'id')
                  const theirLikes = _.differenceBy(_.get(admirers, 'added', []), _.get(favorites, 'added', []), 'id')

                  return Promise.props({
                    matches: Promise.mapSeries(matches, ({ id }) => _getMatch(id)),
                    likes: Promise.mapSeries(likes, ({ id }) => _getLike(id)),
                    theirLikes: Promise.mapSeries([ theirLikes[ 0 ] ], ({ id }) => _getTheirLike(id))
                  }, { concurrency: 1 })
                    .then(({ matches, likes, theirLikes }) => _.merge(matches, likes, theirLikes))
                    .mapSeries((recommendation) => {
                      const messages = []

                      return _isNewMatch(recommendation)
                        .then((isNewMatch) => {
                          return { isNewMatch, recommendation, messages }
                        })
                    })
                })
            })
        })
        .catch(MintNotAuthorizedError, () => { throw new NotAuthorizedError() })
    }

    return _getUpdates()
      .catch(NotAuthorizedError, () => {
        return this.onNotAuthorizedError.bind(this)()
          .then(() => _getUpdates())
      })
  }

  like (userId) {
    const _like = (userId) => {
      return Promise.try(() => {
        if (!userId) {
          throw new Error('invalid arguments')
        }
      })
        .then(() => this._mint.like(userId))
        .then(() => this._mint.getUser(userId))
        .catch(MintNotAuthorizedError, () => { throw new NotAuthorizedError() })
    }

    return _like(userId)
      .catch(NotAuthorizedError, () => {
        return this.onNotAuthorizedError.bind(this)()
          .then(() => _like(userId))
      })
  }

  getUser (userId) {
    const _getUser = (userId) => {
      return Promise.try(() => {
        if (!userId) {
          throw new Error('invalid arguments')
        }
      })
        .then(() => this._mint.getUser(userId))
        .then((data) => {
          return {
            channelName: 'mint',
            channelRecommendationId: data.id,
            name: data.first_name,
            photos: _.map(data.photos, (photo) => _.pick(photo, [ 'url', 'id' ])),
            data
          }
        })
        .catch(MintNotAuthorizedError, () => { throw new NotAuthorizedError() })
    }

    return _getUser(userId)
      .catch(NotAuthorizedError, () => {
        return this.onNotAuthorizedError.bind(this)()
          .then(() => _getUser(userId))
      })
  }

  onNotAuthorizedError () {
    this._mint.accessToken = undefined
    this._mint.userId = undefined

    return super.onNotAuthorizedError()
  }
}

module.exports = new Mint()
