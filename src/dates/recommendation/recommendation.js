/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable camelcase */

const _ = require('lodash')
const Promise = require('bluebird')

const Logger = require('modern-logger')

const moment = require('moment')

const { AlreadyCheckedOutEarlierError, AlreadyLikedError, AlreadyPassedError } = require('./errors')

const Taste = require('../taste')

const Database = require('../../database')

class Recommendation {
  checkOut (channel, channelRecommendationId, channelRecommendation) {
    return Promise.try(() => {
      if (!channel || !channelRecommendationId || !channelRecommendation) {
        throw new Error('invalid arguments')
      }
    })
      .then(() => this.findOrCreateNewRecommendation(channel, channelRecommendationId, channelRecommendation))
      .then((recommendation) => {
        recommendation.checkedOutTimes++

        if (recommendation.lastCheckedOutDate) {
          if (recommendation.isLike || recommendation.isPass) {
            return Promise.reject(new AlreadyCheckedOutEarlierError(recommendation))
          }

          if (moment().isBefore(moment(recommendation.lastCheckedOutDate).add(1, 'day'))) {
            return Promise.reject(new AlreadyCheckedOutEarlierError(recommendation))
          }
        }

        let like
        let pass
        const channelName = channel.name

        return Promise.resolve()
          .then(() => {
            const currentPhotos = recommendation.photos
            const availablePhotos = channelRecommendation.photos
            const photosToCheckOut = _.unionBy(currentPhotos, availablePhotos, 'id')

            return Promise.props({
              photos: Taste.checkPhotosOut(channelName, photosToCheckOut)
            })
              .then(({ photos }) => {
                recommendation.name = channelRecommendation.name
                recommendation.data = channelRecommendation.data
                recommendation.photos = photosToCheckOut
                recommendation.photosSimilarityMean = photos.faceSimilarityMean

                like = photos.like
                pass = photos.pass
              })
          })
          .then(() => {
            if (!recommendation.thumbnailUrl) {
              const firstPhoto = _.get(recommendation, 'photos[0]', undefined)

              return Taste.mentalSnapshot(channelName, firstPhoto)
                .then((url) => {
                  recommendation.thumbnailUrl = url
                })
            }
          })
          .then(() => {
            recommendation.lastCheckedOutDate = new Date()

            return { recommendation, like, pass }
          })
      })
  }

  like (channel, recommendation) {
    return Promise.try(() => {
      if (!channel || !recommendation) {
        throw new Error('invalid arguments')
      }

      if (recommendation.isLike) {
        throw new AlreadyLikedError(recommendation)
      }

      if (recommendation.isPass) {
        throw new AlreadyPassedError(recommendation)
      }
    })
      .then(() => {
        const channelRecommendationId = recommendation.channelRecommendationId

        const { photos, content_hash, s_number } = recommendation.data
        const photoId = _.get(photos, '[0].id')

        return channel.like(channelRecommendationId, photoId, content_hash, s_number)
          .then((match) => {
            return Logger.info(`${recommendation.name} got a like :+1:(photos = ${recommendation.photosSimilarityMean}%)`)
              .then(() => {
                recommendation.isLike = true

                if (!match) {
                  return recommendation
                }

                return this.setUpMatch(recommendation, match)
              })
          })
      })
  }

  pass (channel, recommendation) {
    return Promise.try(() => {
      if (!channel || !recommendation) {
        throw new Error('invalid arguments')
      }

      if (recommendation.isPass) {
        throw new AlreadyPassedError(recommendation)
      }

      if (recommendation.isLike) {
        throw new AlreadyLikedError(recommendation)
      }
    })
      .then(() => {
        recommendation.isPass = true

        return Logger.info(`${recommendation.name} got a pass :-1:(photos = ${recommendation.photosSimilarityMean}%)`)
          .then(() => recommendation)
      })
  }

  fallInLove (recommendation) {
    if (!recommendation) {
      return Promise.reject(new Error('invalid arguments'))
    }

    if (recommendation.isTrain) {
      return Promise.resolve(recommendation)
    }

    const photos = recommendation.photos

    return Taste.acquireTaste(photos)
      .then(() => _.merge(recommendation, {
        isTrain: true,
        trainedDate: new Date()
      }))
  }

  couldDoBetter (recommendation) {
    if (!recommendation) {
      return Promise.reject(new Error('invalid arguments'))
    }

    return Promise.resolve(recommendation)
  }

  findOrCreateNewRecommendation (channel, channelRecommendationId, channelRecommendation) {
    if (!channel || !channelRecommendationId) {
      return Promise.reject(new Error('invalid arguments'))
    }

    const channelName = channel.name

    return Database.recommendations.find({ where: { channelName, channelRecommendationId } })
      .then((recommendation) => {
        if (recommendation) {
          return recommendation
        }

        return Promise.resolve()
          .then(() => {
            if (channelRecommendation) {
              return channelRecommendation
            }

            return channel.getUser(channelRecommendationId)
          })
          .then((channelRecommendation) => Database.recommendations.create(channelRecommendation))
      })
  }

  setUpMatch (recommendation, channelRecommendation) {
    return Promise.resolve()
      .then(() => {
        if (!recommendation || !channelRecommendation) {
          throw new Error('invalid arguments')
        }

        recommendation.isMatch = true
        recommendation.channelMatchId = channelRecommendation.channelMatchId
        recommendation.matchedDate = channelRecommendation.matchedDate

        return Logger.info(`${recommendation.name} is a :fire:(photos = ${_.defaultTo(recommendation.photosSimilarityMean, 0)}%)`)
          .then(() => recommendation)
      })
  }
}

module.exports = new Recommendation()
