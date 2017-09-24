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

const { OutOfLikesError } = require('../channels')

const Database = require('../database')

const Taste = require('./taste')
const { Recommendation, AlreadyCheckedOutEarlierError } = require('./recommendation')
const { Match } = require('./match')
const Stats = require('./stats')
const Channel = require('./channel')

const likePassOrWait = (channel, recommendation, like, pass) => {
  if (like) {
    return Recommendation.like(channel, recommendation)
      .then((recommendation) => {
        recommendation.isHumanDecision = false
        recommendation.decisionDate = new Date()

        return recommendation
      })
  } else if (pass) {
    return Recommendation.pass(channel, recommendation)
      .then((recommendation) => {
        recommendation.isHumanDecision = false
        recommendation.decisionDate = new Date()

        return recommendation
      })
  }

  return Logger.info(`${recommendation.name} has to wait :raised_hand:(photos = ${recommendation.photosSimilarityMean}%)`)
    .then(() => recommendation)
}

const findByChannel = function (channel) {
  const checkRecommendations = function (channel) {
    return Logger.info(`Started checking recommendations from ${_.capitalize(channel.name)} channel`)
      .then(() => this.checkRecommendations(channel))
      .then(({ received = 0, skipped = 0, failed = 0 }) => Logger.info(`Finished checking recommendations from ${_.capitalize(channel.name)} channel (received = ${received}, skipped = ${skipped}, failed = ${failed})`))
  }

  const checkUpdates = function (channel) {
    return Logger.info(`Started checking updates from ${_.capitalize(channel.name)} `)
      .then(() => this.checkUpdates(channel))
      .then(({ matches = 0, messages = 0 }) => Logger.info(`Finished checking updates from ${_.capitalize(channel.name)} (matches = ${matches}, messages = ${messages})`))
  }

  return checkRecommendations.bind(this)(channel)
    .then(() => checkUpdates.bind(this)(channel))
}

class Dates {
  start () {
    const startChannel = () => {
      return Channel.start()
        .catch((error) => Logger.warn(error))
    }

    const startTaste = () => {
      return Taste.start()
        .catch((error) => Logger.warn(error))
    }

    return Promise.all([ startChannel(), startTaste() ])
  }

  find (channelNames = []) {
    const startDate = _.now()

    Logger.info('Started finding dates')

    const updateStats = () => {
      return Logger.info('Started updating stats')
        .then(() => Stats.update())
        .finally(() => Logger.info('Finished updating stats'))
    }

    return Database.channels.findAll()
      .mapSeries(({ name, isEnabled }) => {
        if ((_.isEmpty(channelNames) && !isEnabled) ||
          (!_.isEmpty(channelNames) && !_.includes(channelNames, name))) {
          return
        }

        return this.findByChannelName(name)
      })
      .then(() => updateStats())
      .finally(() => {
        const stopDate = _.now()
        const duration = _.round((stopDate - startDate) / 1000, 1)

        Logger.info(`Finished finding dates (time = ${duration}s)`)
      })
  }

  findByChannelName (channelName) {
    return Channel.getByName(channelName)
      .then((channel) => {
        return Logger.info(`Started finding dates in ${_.capitalize(channel.name)} channel`)
          .then(() => findByChannel.bind(this)(channel))
          .finally(() => Logger.info(`Finished finding dates in ${_.capitalize(channel.name)} channel`))
      })
  }

  checkRecommendations (channel) {
    let received = 0
    let skipped = 0
    let failed = 0

    return channel.getRecommendations()
      .then((channelRecommendations) => {
        received = _.size(channelRecommendations)

        return Logger.debug(`Got ${received} recommendations from ${_.capitalize(channel.name)}`)
          .then(() => Promise.map(channelRecommendations, (channelRecommendation) => {
            const { channelRecommendationId } = channelRecommendation

            return Recommendation.checkOut(channel, channelRecommendationId, channelRecommendation)
              .then(({ recommendation, like, pass }) => likePassOrWait(channel, recommendation, like, pass))
              .then((recommendation) => recommendation.save())
              .catch(AlreadyCheckedOutEarlierError, ({ recommendation }) => {
                skipped++

                return recommendation.save()
              })
              .catch(OutOfLikesError, () => {
                skipped++
              })
              .catch((error) => {
                failed++

                return Logger.warn(error)
              })
          }, { concurrency: 1 }))
      })
      .then(() => { return { received, skipped, failed } })
      .catch((error) => Logger.error(error))
  }

  checkUpdates (channel) {
    return channel.getUpdates()
      .mapSeries((match) => {
        return Match.checkLatestNews(channel, match)
          .catch((error) => {
            Logger.warn(error)

            return { messages: 0, matches: 0 }
          })
      })
      .then((updates) => {
        return _.reduce(updates, (accumulator, update) => {
          accumulator.messages += update.messages
          accumulator.matches += update.matches
          return accumulator
        }, { messages: 0, matches: 0 })
      })
      .catch((error) => Logger.error(error))
  }
}

module.exports = new Dates()
