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

class Recommendation {
  checkOut (channel, channelRecommendationId, channelRecommendation) {
    if (!channel || !channelRecommendationId) {
      return Promise.reject(new Error('invalid arguments'))
    }

    return this.findOrCreateNewRecommendation(channel, channelRecommendationId, channelRecommendation)
      .then((recommendation) => {
        if (recommendation.last_checked_out_date) {
          return Promise.reject(new AlreadyCheckedOutEarlierError())
        }

        return Promise.resolve()
          .then(() => {
            const photosToCheckOut = _.unionBy(_.get(recommendation, 'data.photos', []), channelRecommendation.photos, 'id')

            return Promise.props({
              photos: Taste.checkPhotosOut(photosToCheckOut)
            })
              .then(({ photos }) => {
                channelRecommendation.photos = photosToCheckOut

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
          return channel.like(recommendation.channel_id, recommendation.data.photos[ 0 ].id, recommendation.data.content_hash, recommendation.data.s_number)
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

  fallInLove (recommendation) {
    if (!recommendation) {
      return Promise.reject(new Error('invalid arguments'))
    }

    if (recommendation.train) {
      return Promise.resolve()
    }

    const { photos } = recommendation.data

    return Taste.acquireTaste(photos)
      .then(() => _.merge(recommendation, {
        train: true,
        trained_date: new Date()
      }))
  }

  findOrCreateNewRecommendation (channel, channelRecommendationId, channelRecommendation) {
    if (!channel || !channelRecommendationId) {
      return Promise.reject(new Error('invalid arguments'))
    }

    const channelName = channel.name

    return Recommendations.findByChannelAndChannelId(channelName, channelRecommendationId)
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
          .then((channelRecommendation) => {
            const recommendation = {
              channel: channel.name,
              channel_id: channelRecommendationId,
              data: channelRecommendation
            }

            return Recommendations.save(channel.name, channelRecommendationId, recommendation)
          })
      })
  }
}

module.exports = new Recommendation()
