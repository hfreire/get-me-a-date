/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

const Logger = require('modern-logger')

const { Recommendations } = require('../../database')
const { Recommendation, AlreadyCheckedOutEarlierError } = require('../recommendation')

const Message = require('./message')

const findOrCreateNewRecommendationFromMatch = function (channel, channelRecommendationId, match) {
  const channelName = channel.name
  const channelRecommendation = match.person

  return Recommendation.findOrCreateNewRecommendation(channel, channelRecommendationId, channelRecommendation)
    .then((recommendation) => {
      if (!recommendation.match) {
        recommendation.like = true
        recommendation.match = true
        recommendation.match_id = match._id

        if (match.created_date) {
          recommendation.matched_date = new Date(match.created_date.replace(/T/, ' ').replace(/\..+/, ''))
        }
      }

      return recommendation
    })
    .then((recommendation) => Recommendations.save(channelName, channelRecommendationId, recommendation))
}

class Match {
  checkLatestNews (channel, accountUserId, match) {
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
            // TODO: checkOut() is putting like = 0 if a new match comes in and is not similar enough
            return Recommendation.checkOut(channel, channelRecommendationId, channelRecommendation)
              .catch(AlreadyCheckedOutEarlierError, () => recommendation)
          })
          .then((recommendation) => Recommendation.fallInLove(recommendation))
          .then((recommendation) => Recommendations.save(channelName, channelRecommendationId, recommendation))
          .then((recommendation) => {
            if (match.is_new_message) {
              return Logger.info(`${recommendation.data.name} has ${messages} :envelope:`)
            } else {
              return Logger.info(`${recommendation.data.name} is a :fire:(photos = ${recommendation.photos_similarity_mean}%)`)
            }
          })
      })
      .then(() => { return { messages, matches } })
  }
}

module.exports = new Match()
