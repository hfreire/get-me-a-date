/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

const _ = require('lodash')
const Promise = require('bluebird')

const Database = require('../database')

const stats = [
  { name: 'likes', metric: 'liked_date', criteria: { like: 1 } },
  { name: 'passes', metric: 'last_checked_out_date', criteria: { like: 0 } },
  { name: 'trains', metric: 'trained_date', criteria: { train: 1 } },
  { name: 'matches', metric: 'matched_date', criteria: { match: 1 } }
]

class Stats {
  update () {
    return Database.Stats.findAll()
      .then(({ results }) => {
        if (_.isEmpty(results)) {
          return this.updateFromStart()
        }

        const date = new Date()
        date.setHours(0, 0, 0, 0)

        return this.updateByDate(date)
      })
  }

  updateFromStart () {
    return Promise.mapSeries(stats, ({ name, metric, criteria }) => {
      return Database.Recommendations.findAll(1, 1000, undefined, [ metric ], metric, true)
        .then(({ results }) => results)
        .mapSeries((result) => {
          if (!result[ metric ]) {
            return
          }

          return this.updateByStatsAndDate({ name, metric, criteria }, result[ metric ])
        })
    })
  }

  updateByDate (date) {
    return Promise.mapSeries((stats), (stats) => this.updateByStatsAndDate(stats, date))
  }

  updateByStatsAndDate ({ name, metric, criteria }, date) {
    const _criteria = _.merge({ [metric]: date }, criteria)

    return Database.Recommendations.findAll(1, 10000, _criteria)
      .then(({ totalCount }) => Database.Stats.save(date, { [name]: totalCount }))
  }
}

module.exports = new Stats()
