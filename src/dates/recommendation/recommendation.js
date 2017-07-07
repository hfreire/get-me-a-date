/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable camelcase */

const _ = require('lodash')
const Promise = require('bluebird')

const { AlreadyCheckedOutEarlierError } = require('./errors')

const Taste = require('../taste')

const Database = require('../../database')

class Recommendation {
  checkOut (channel, channelRecommendationId, channelRecommendation) {
    if (!channel || !channelRecommendationId) {
      return Promise.reject(new Error('invalid arguments'))
    }

    let like
    let pass

    return this.findOrCreateNewRecommendation(channel, channelRecommendationId, channelRecommendation)
      .then((recommendation) => {
        recommendation.checkedOutTimes++

        if (recommendation.lastCheckedOutDate) {
          return Promise.reject(new AlreadyCheckedOutEarlierError(recommendation))
        }

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
                recommendation.lastCheckedOutDate = new Date()
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
            return { recommendation, like, pass }
          })
      })
  }

  like (channel, recommendation) {
    if (!channel || !recommendation) {
      return Promise.reject(new Error('invalid arguments'))
    }

    if (recommendation.isLike) {
      return Promise.reject(new Error('already liked'))
    }

    if (recommendation.isPass) {
      return Promise.reject(new Error('already passed'))
    }

    const channelRecommendationId = recommendation.channelRecommendationId

    const { photos, content_hash, s_number } = recommendation.data
    const photoId = _.get(photos, '[0].id')

    return channel.like(channelRecommendationId, photoId, content_hash, s_number)
      .then((match) => {
        recommendation.isLike = true

        if (!match) {
          return recommendation
        }

        return this.setUpMatch(recommendation, match)
      })
      .then((recommendation) => recommendation)
  }

  pass (channel, recommendation) {
    if (!channel || !recommendation) {
      return Promise.reject(new Error('invalid arguments'))
    }

    if (recommendation.isPass) {
      return Promise.resolve()
    }

    if (recommendation.isLike) {
      return Promise.reject(new Error('can not pass'))
    }

    recommendation.isPass = true

    return Promise.resolve(recommendation)
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
        trained_date: new Date()
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

  setUpMatch (recommendation, match) {
    if (!recommendation || !match) {
      throw new Error('invalid arguments')
    }

    recommendation.isMatch = true
    recommendation.channelMatchId = match.channelMatchId

    if (match.created_date) {
      recommendation.matched_date = new Date(match.created_date.replace(/T/, ' ').replace(/\..+/, ''))
    } else if (match.creation_date) {
      recommendation.matched_date = new Date(match.creation_date.replace(/T/, ' ').replace(/\..+/, ''))
    } else {
      recommendation.matched_date = new Date()
    }

    return recommendation
  }
}

module.exports = new Recommendation()
