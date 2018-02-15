/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE.md file in the root directory of this source tree.
 */

/* eslint-disable camelcase */

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

const Health = require('health-checkup')

const moment = require('moment')

const { NotAuthorizedError, OutOfLikesError } = require('./errors')

const { TinderWrapper, TinderNotAuthorizedError, TinderOutOfLikesError } = require('tinder-wrapper')

const Database = require('../database')

const defaultOptions = {
  oauth: {
    facebook: {
      clientId: TINDER_FACEBOOK_LOGIN_APP_CLIENT_ID,
      redirectUri: TINDER_FACEBOOK_LOGIN_APP_REDIRECT_URI,
      optionalParams: TINDER_FACEBOOK_LOGIN_APP_OPTIONAL_PARAMS
    }
  },
  channel: { is_enabled: false }
}

class Tinder extends Channel {
  constructor (options = {}) {
    super('tinder')

    this._options = _.defaults(options, defaultOptions)

    this._tinder = new TinderWrapper()

    Health.addCheck(this.name, () => new Promise((resolve, reject) => {
      if (this._tinder.circuitBreaker.isOpen()) {
        return reject(new Error(`circuit breaker is open`))
      } else {
        return resolve()
      }
    }))
  }

  authorize () {
    const authorize = function ({ facebookAccessToken, facebookUserId }) {
      return this._tinder.authorize(facebookAccessToken, facebookUserId)
        .then(() => this.getAccount())
        .then(({ user }) => {
          const userId = user._id
          const accessToken = this._tinder.authToken

          return { userId, accessToken }
        })
    }

    return this.findOrAuthorizeIfNeeded(authorize.bind(this))
      .then(({ accessToken }) => {
        this._tinder.authToken = accessToken
      })
  }

  getAccount () {
    const _getAccount = () => {
      return this._tinder.getAccount()
        .catch(TinderNotAuthorizedError, () => { throw new NotAuthorizedError() })
    }

    return _getAccount()
      .catch(NotAuthorizedError, () => {
        return this.onNotAuthorizedError.bind(this)()
          .then(() => _getAccount())
      })
  }

  getRecommendations () {
    const _getRecommendations = () => {
      return this._tinder.getRecommendations()
        .then(({ results }) => results)
        .mapSeries((result) => {
          return {
            channelName: 'tinder',
            channelRecommendationId: result._id,
            name: result.name,
            photos: _.map(result.photos, (photo) => _.pick(photo, [ 'url', 'id' ])),
            data: result
          }
        })
        .catch(TinderNotAuthorizedError, () => { throw new NotAuthorizedError() })
    }

    return _getRecommendations()
      .catch(NotAuthorizedError, () => {
        return this.onNotAuthorizedError.bind(this)()
          .then(() => _getRecommendations())
      })
  }

  getUpdates () {
    const _getUpdates = () => {
      return Database.channels.find({ where: { name: this._name } })
        .then(({ lastActivityDate, userId }) => {
          const _lastActivityDate = !lastActivityDate ? undefined : lastActivityDate

          return this._tinder.getUpdates(_lastActivityDate)
            .then((data) => {
              return Database.channels.update({ lastActivityDate: new Date() }, { where: { name: this._name } })
                .then(() => {
                  return Promise.mapSeries((data.matches), (match) => {
                    if (match.is_new_message) {
                      const channelRecommendationId = match.messages[ 0 ].from === userId ? match.messages[ 0 ].to : match.messages[ 0 ].from
                      const channelMatchId = match.messages[ 0 ].match_id
                      const messages = _.map(match.messages, (message) => {
                        return {
                          channelName: 'tinder',
                          channelMessageId: message._id,
                          recommendationId: channelRecommendationId,
                          isFromRecommendation: message.from !== userId,
                          sentDate: new Date(message.sent_date.replace(/T/, ' ').replace(/\..+/, '')),
                          text: message.message
                        }
                      })

                      return this.getUser(channelRecommendationId)
                        .then((channelRecommendation) => {
                          channelRecommendation.channelMatchId = channelMatchId

                          return { recommendation: channelRecommendation, messages }
                        })
                    } else {
                      return {
                        isNewMatch: true,
                        recommendation: {
                          channelName: 'tinder',
                          channelRecommendationId: match.person._id,
                          name: match.person.name,
                          photos: _.map(match.person.photos, (photo) => _.pick(photo, [ 'url', 'id' ])),
                          channelMatchId: match.id,
                          matchedDate: new Date(match.created_date),
                          data: match.person
                        },
                        messages: _.map(match.messages, (message) => {
                          return {
                            channelName: 'tinder',
                            channelMessageId: message._id,
                            recommendationId: message.from === userId ? message.to : message.from,
                            isFromRecommendation: message.from !== userId,
                            sentDate: new Date(message.sent_date.replace(/T/, ' ').replace(/\..+/, '')),
                            text: message.message
                          }
                        })
                      }
                    }
                  })
                })
            })
        })
        .catch(TinderNotAuthorizedError, () => { throw new NotAuthorizedError() })
    }

    return _getUpdates()
      .catch(NotAuthorizedError, () => {
        return this.onNotAuthorizedError.bind(this)()
          .then(() => _getUpdates())
      })
  }

  like (userId, photoId, contentHash, sNumber) {
    const _like = (userId, photoId, contentHash, sNumber) => {
      return Promise.try(() => {
        if (!userId) {
          throw new Error('invalid arguments')
        }
      })
        .then(() => Database.channels.find({ where: { name: this._name } }))
        .then(({ isOutOfLikes, outOfLikesDate }) => {
          if (isOutOfLikes) {
            if (moment().isBefore(moment(outOfLikesDate).add(12, 'hour'))) {
              throw new OutOfLikesError()
            } else {
              return Database.channels.update({
                isOutOfLikes: false,
                outOfLikesDate: null
              }, { where: { name: this._name } })
            }
          }
        })
        .then(() => {
          return this._tinder.like(userId, photoId, contentHash, sNumber)
            .then(({ match }) => {
              if (!match) {
                return
              }

              return {
                channelName: 'tinder',
                channelRecommendationId: match.person._id,
                name: match.person.name,
                photos: _.map(match.person.photos, (photo) => _.pick(photo, [ 'url', 'id' ])),
                channelMatchId: match.id,
                matchedDate: new Date(match.created_date),
                data: match.person
              }
            })
            .catch(TinderOutOfLikesError, () => this.onOutOfLikesError())
        })
        .catch(TinderNotAuthorizedError, () => { throw new NotAuthorizedError() })
    }

    return _like(userId, photoId, contentHash, sNumber)
      .catch(NotAuthorizedError, () => {
        return this.onNotAuthorizedError.bind(this)()
          .then(() => _like(userId, photoId, contentHash, sNumber))
      })
  }

  getUser (userId) {
    const _getUser = (userId) => {
      return Promise.try(() => {
        if (!userId) {
          throw new Error('invalid arguments')
        }
      })
        .then(() => this._tinder.getUser(userId))
        .then(({ results }) => {
          return {
            channelName: 'tinder',
            channelRecommendationId: results._id,
            name: results.name,
            photos: _.map(results.photos, (photo) => _.pick(photo, [ 'url', 'id' ])),
            data: results
          }
        })
        .catch(TinderNotAuthorizedError, () => { throw new NotAuthorizedError() })
    }

    return _getUser(userId)
      .catch(NotAuthorizedError, () => {
        return this.onNotAuthorizedError.bind(this)()
          .then(() => _getUser(userId))
      })
  }

  onNotAuthorizedError () {
    this._tinder.authToken = undefined

    return super.onNotAuthorizedError()
  }
}

module.exports = new Tinder()
