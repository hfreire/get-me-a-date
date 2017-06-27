/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable camelcase */

const Logger = require('modern-logger')

const { Recommendations, Channels } = require('../../databases')
const { Recommendation, AlreadyCheckedOutEarlierError } = require('../recommendation')

const Message = require('./message')

const findOrCreateNewRecommendationFromMatch = function (channel, channelRecommendationId, match) {
  const channelName = channel.name
  const channelRecommendation = match.person

  return Recommendation.findOrCreateNewRecommendation(channel, channelRecommendationId, channelRecommendation)
    .then((recommendation) => {
      if (!recommendation.like) {
        recommendation.like = true
      }

      if (recommendation.match) {
        return recommendation
      }

      return Recommendation.setUpMatch(recommendation, match)
    })
    .then((recommendation) => Recommendations.save([ channelName, channelRecommendationId ], recommendation))
}

class Match {
  checkLatestNews (channel, match) {
    const channelName = channel.name

    return Channels.findByName(channelName)
      .then(({ user_id }) => {
        const accountUserId = user_id

        let messages = 0
        let matches = 0

        let channelRecommendationId
        if (match.is_new_message) {
          channelRecommendationId = match.messages[ 0 ].from !== accountUserId ? match.messages[ 0 ].from : match.messages[ 0 ].to
        } else {
          matches++
          channelRecommendationId = match.person._id
        }

        messages += match.messages.length

        return findOrCreateNewRecommendationFromMatch.bind(this)(channel, channelRecommendationId, match)
          .then((recommendation) => {
            const channelName = channel.name
            const channelRecommendation = match.person

            return Message.readMessages(channel, accountUserId, recommendation.id, match.messages)
              .then(() => {
                return Recommendation.checkOut(channel, channelRecommendationId, channelRecommendation)
                  .catch(AlreadyCheckedOutEarlierError, () => { return { recommendation } })
              })
              .then(({ recommendation }) => Recommendation.fallInLove(recommendation))
              .then((recommendation) => Recommendations.save([ channelName, channelRecommendationId ], recommendation))
              .then((recommendation) => {
                if (match.is_new_message) {
                  return Logger.info(`${recommendation.data.name} has ${messages} :envelope:`)
                }

                return Logger.info(`${recommendation.data.name} is a :fire:(photos = ${recommendation.photos_similarity_mean}%)`)
              })
          })
          .then(() => { return { messages, matches } })
      })
  }
}

module.exports = new Match()
