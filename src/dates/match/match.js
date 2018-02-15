/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE.md file in the root directory of this source tree.
 */

/* eslint-disable camelcase */

const _ = require('lodash')
const Promise = require('bluebird')

const Logger = require('modern-logger')

const { Recommendation, AlreadyCheckedOutEarlierError } = require('../recommendation')

const Message = require('./message')

const findOrCreateNewRecommendationFromMatch = function (channel, channelRecommendationId, channelRecommendation) {
  return Recommendation.findOrCreateNewRecommendation(channel, channelRecommendationId, channelRecommendation)
    .then((recommendation) => {
      if (recommendation.isMatch) {
        return recommendation
      }

      if (!recommendation.isLike) {
        recommendation.isLike = true
        recommendation.isHumanDecision = true
      }

      recommendation.isTheirLike = true

      return Recommendation.setUpMatch(recommendation, channelRecommendation)
    })
    .then((recommendation) => recommendation.save())
}

class Match {
  checkLatestNews (channel, match) {
    const channelRecommendation = match.recommendation
    const channelRecommendationId = channelRecommendation.channelRecommendationId
    const messages = match.messages

    return findOrCreateNewRecommendationFromMatch.bind(this)(channel, channelRecommendationId, channelRecommendation)
      .then((recommendation) => {
        return Message.readMessages(messages)
          .then(() => {
            return Recommendation.checkOut(channel, channelRecommendationId, channelRecommendation)
              .catch(AlreadyCheckedOutEarlierError, () => { return { recommendation } })
          })
          .then(({ recommendation }) => Recommendation.fallInLove(recommendation))
          .then((recommendation) => recommendation.save())
          .then((recommendation) => {
            return Promise.resolve()
              .then(() => {
                if (!_.isEmpty(messages)) {
                  return Logger.info(`${recommendation.name} has ${messages.length} :envelope:`)
                }
              })
          })
          .then(() => { return { messages: messages.length, matches: match.isNewMatch ? 1 : 0 } })
      })
  }
}

module.exports = new Match()
