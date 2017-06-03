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

const { Recommendations } = require('../database')

const findOrCreateNewRecommendation = (channel, channelRecommendationId) => {
  if (!channel || !channelRecommendationId) {
    return Promise.reject(new Error('invalid arguments'))
  }

  const channelName = channel.name

  return Recommendations.findByChannelAndChannelId(channel.name, channelRecommendationId)
    .then((recommendation) => {
      if (!recommendation) {
        return { channel: channelName, channel_id: channelRecommendationId }
      }

      return recommendation
    })
}

class Recommendation {
  checkOut (channel, channelRecommendation) {
    if (!channel || !channelRecommendation) {
      return Promise.reject(new Error('invalid arguments'))
    }

    const channelRecommendationId = channelRecommendation._id

    return findOrCreateNewRecommendation(channel, channelRecommendationId)
      .then((recommendation) => {
        /* if (recommendation.last_checked_out_date) {
          return Promise.reject(new AlreadyCheckedOutEarlierError())
         } */

        return Promise.resolve()
          .then(() => {
            const photosToCheckOut = _.unionBy(_.get(recommendation, 'data.photos', []), channelRecommendation.photos, 'id')

            return Promise.props({
              photos: Taste.checkPhotosOut(photosToCheckOut)
            })
              .then(({ photos }) => {
                recommendation.last_checked_out_date = new Date()
                recommendation.data = channelRecommendation
                recommendation.like = photos.like
                recommendation.photos_similarity_mean = photos.faceSimilarityMean
              })
          })
          .then(() => {
            if (!recommendation.data.photos[ 0 ].thumbnailUrl) {
              return Taste.mentalSnapshot(recommendation.data.photos[ 0 ])
            }
          })
          .then(() => recommendation)
      })
  }

  likeOrPass (channel, recommendation) {
    if (!channel || !recommendation) {
      return Promise.reject(new Error('invalid arguments'))
    }

    return Promise.resolve()
      .then(() => {
        if (recommendation.like) {
          return channel.like(recommendation.channel_id)
            .then((match) => {
              recommendation.liked_date = new Date()
              recommendation.match = !!match
              if (match) {
                recommendation.match_id = match._id
              }
            })
            .then(() => recommendation)
        }

        return recommendation
      })
  }
}

module.exports = new Recommendation()
