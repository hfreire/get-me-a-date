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

const { Recommendations } = require('../../databases')
const { Recommendation, AlreadyCheckedOutEarlierError } = require('../recommendation')

const Message = require('./message')

const findOrCreateNewRecommendationFromMatch = function (channel, channelRecommendationId, match) {
  const channelName = channel.name
  const channelRecommendation = match.recommendation

  return Recommendation.findOrCreateNewRecommendation(channel, channelRecommendationId, channelRecommendation)
    .then((recommendation) => {
      if (recommendation.match) {
        return recommendation
      }

      if (!recommendation.like) {
        recommendation.like = true
        recommendation.is_human_decision = true
      }

      return Recommendation.setUpMatch(recommendation, match)
        .then(() => Logger.info(`${recommendation.name} is a :fire:(photos = ${recommendation.photos_similarity_mean}%)`))
    })
    .then((recommendation) => Recommendations.save([ channelName, channelRecommendationId ], recommendation))
}

class Match {
  checkLatestNews (channel, match) {
    const channelName = channel.name

    const channelRecommendation = match.recommendation
    const channelRecommendationId = channelRecommendation.channel_id
    const messages = match.messages

    return findOrCreateNewRecommendationFromMatch.bind(this)(channel, channelRecommendationId, match)
      .then((recommendation) => {
        return Message.readMessages(messages)
          .then(() => {
            return Recommendation.checkOut(channel, channelRecommendationId, channelRecommendation)
              .catch(AlreadyCheckedOutEarlierError, () => { return { recommendation } })
          })
          .then(({ recommendation }) => Recommendation.fallInLove(recommendation))
          .then((recommendation) => Recommendations.save([ channelName, channelRecommendationId ], recommendation))
          .then((recommendation) => {
            return Promise.resolve()
              .then(() => {
                if (match.isNewMatch) {
                  return Logger.info(`${recommendation.name} is a :fire:(photos = ${recommendation.photos_similarity_mean}%)`)
                }
              })
              .then(() => {
                if (!_.isEmpty(messages)) {
                  return Logger.info(`${recommendation.name} has ${messages.length} :envelope:`)
                }
              })
          })
          .then(() => { return { messages: messages.length, matches: match.isNewMatch ? 0 : 1 } })
      })
  }
}

module.exports = new Match()
