/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

const _ = require('lodash')
const Promise = require('bluebird')

const Database = require('../database')

const moment = require('moment')

const stats = [
  { name: 'machineLikes', metric: 'decisionDate', criteria: { isHumanDecision: false, isLike: true } },
  { name: 'humanLikes', metric: 'decisionDate', criteria: { isHumanDecision: true, isLike: true } },
  { name: 'machinePasses', metric: 'decisionDate', criteria: { isHumanDecision: false, isPass: true } },
  { name: 'humanPasses', metric: 'decisionDate', criteria: { isHumanDecision: true, isPass: true } },
  { name: 'trains', metric: 'trainedDate', criteria: { isTrain: true } },
  { name: 'matches', metric: 'matchedDate', criteria: { isMatch: true } },
  { name: 'skips', metric: 'lastCheckedOutDate', criteria: { isLike: false, isPass: false } }
]

class Stats {
  update () {
    return Database.stats.count()
      .then((count) => {
        if (!count) {
          return this.updateFromStart()
        }

        return this.updateByDate(new Date())
      })
  }

  updateFromStart () {
    return Promise.mapSeries(stats, ({ name, metric, criteria }) => {
      return Database.recommendations.findAll({
        attributes: [ [ Database._sequelize.fn('DISTINCT', Database._sequelize.fn('strftime', '%Y-%m-%d', Database._sequelize.col(metric))), 'metric' ] ],
        order: [ metric ]
      })
        .mapSeries((result) => {
          if (!result.get('metric')) {
            return
          }

          return this.updateByStatsAndDate({ name, metric, criteria }, result.get('metric'))
        })
    })
  }

  updateByDate (date) {
    return Promise.try(() => {
      if (!_.isDate(date)) {
        throw new Error('invalid arguments')
      }

      return moment(date).startOf('day').toDate()
    })
      .then((date) => Promise.mapSeries((stats), (stats) => this.updateByStatsAndDate(stats, date)))
  }

  updateByStatsAndDate ({ name, metric, criteria }, date) {
    const where = _.merge({
      [ metric ]: {
        $gte: date,
        $lt: Database._sequelize.fn('strftime', '%Y-%m-%dT%H:%M:%fZ', Database._sequelize.fn('datetime', date, '+1 day'))
      }
    }, criteria)

    return Database.recommendations.findAll({ where })
      .then((results) => {
        return Database.stats.upsert({ date, [ name ]: results.length }, { where: { date } })
      })
  }
}

module.exports = new Stats()
