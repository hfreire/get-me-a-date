/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable camelcase */

const _ = require('lodash')

const Logger = require('modern-logger')

const { Recommendations, Channels } = require('../../databases')
const { Recommendation, AlreadyCheckedOutEarlierError } = require('../recommendation')

const Message = require('./message')

const findOrCreateNewRecommendationFromMatch = function (channel, channelRecommendationId, match) {
  const channelName = channel.name
  const channelRecommendation = getChannelRecommendationFromMatch(match)

  return Recommendation.findOrCreateNewRecommendation(channel, channelRecommendationId, channelRecommendation)
    .then((recommendation) => {
      if (recommendation.match) {
        return recommendation
      }

      recommendation.like = true
      recommendation.is_human_decision = true

      return Recommendation.setUpMatch(recommendation, match)
    })
    .then((recommendation) => Recommendations.save([ channelName, channelRecommendationId ], recommendation))
}

const getChannelRecommendationFromMatch = (match) => {
  if (isNewMessageFromMatch(match)) {
    return undefined
  } else {
    return match.person || match
  }
}

const getChannelRecommendationIdFromMatch = (channelUserId, match) => {
  if (isNewMessageFromMatch(match)) {
    return match.messages[ 0 ].from !== channelUserId ? match.messages[ 0 ].from : match.messages[ 0 ].to
  } else {
    return _.get(match, 'person._id') || _.get(match, 'notifier.id')
  }
}

const isNewMessageFromMatch = (match) => {
  return match.is_new_message || !_.isEmpty(match.messages)
}

const getMessagesFromMatch = (match) => {
  return match.messages || []
}

class Match {
  checkLatestNews (channel, match) {
    const channelName = channel.name

    return Channels.findByName(channelName)
      .then(({ user_id }) => {
        const channelUserId = user_id
        const channelRecommendationId = getChannelRecommendationIdFromMatch(channelUserId, match)
        const channelRecommendation = getChannelRecommendationFromMatch(match)
        const isNewMessage = isNewMessageFromMatch(match)
        const messages = getMessagesFromMatch(match)

        return findOrCreateNewRecommendationFromMatch.bind(this)(channel, channelRecommendationId, match)
          .then((recommendation) => {
            return Message.readMessages(channelName, channelRecommendationId, messages)
              .then(() => {
                return Recommendation.checkOut(channel, channelRecommendationId, channelRecommendation)
                  .catch(AlreadyCheckedOutEarlierError, () => { return { recommendation } })
              })
              .then(({ recommendation }) => Recommendation.fallInLove(recommendation))
              .then((recommendation) => Recommendations.save([ channelName, channelRecommendationId ], recommendation))
              .then((recommendation) => {
                if (isNewMessage) {
                  return Logger.info(`${recommendation.name} has ${messages.length} :envelope:`)
                }

                return Logger.info(`${recommendation.name} is a :fire:(photos = ${recommendation.photos_similarity_mean}%)`)
              })
              .then(() => { return { messages: messages.length, matches: isNewMessage ? 0 : 1 } })
          })
      })
  }
}

module.exports = new Match()
