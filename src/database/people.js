/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

const _ = require('lodash')
const Promise = require('bluebird')

const SQLite = require('./sqlite')

const transformRowToObject = function (row) {
  if (!row) {
    return
  }

  row.created_date = new Date(row.created_date)
  row.updated_date = new Date(row.updated_date)
  row.liked_date = new Date(row.liked_date)
  row.trained_date = new Date(row.trained_date)
  row.last_checked_out_date = new Date(row.last_checked_out_date)

  if (row.data) {
    row.data = JSON.parse(row.data)
  }

  return row
}

const transformObjectToRow = function (object) {
  if (!object) {
    return
  }

  if (object.created_date instanceof Date) {
    object.created_date = object.created_date.toISOString().replace(/T/, ' ').replace(/\..+/, '')
  }

  if (object.updated_date instanceof Date) {
    object.updated_date = object.updated_date.toISOString().replace(/T/, ' ').replace(/\..+/, '')
  }

  if (object.liked_date instanceof Date) {
    object.liked_date = object.liked_date.toISOString().replace(/T/, ' ').replace(/\..+/, '')
  }

  if (object.trained_date instanceof Date) {
    object.trained_date = object.trained_date.toISOString().replace(/T/, ' ').replace(/\..+/, '')
  }

  if (object.last_checked_out_date instanceof Date) {
    object.last_checked_out_date = object.last_checked_out_date.toISOString().replace(/T/, ' ').replace(/\..+/, '')
  }

  if (object.data) {
    object.data = JSON.stringify(object.data)
  }

  return object
}

const queryAll = function (...args) {
  return SQLite.all(...args)
    .mapSeries((row) => transformRowToObject(row))
}

const buildWhereClause = (keys, values) => {
  if (_.includes(keys, 'updated_date')) {
    const index = _.indexOf(keys, 'updated_date')
    values[ index ] = values[ index ].split(' ')[ 0 ]
    values.splice(index, 0, values[ index ])
  }

  return keys.map((key) => {
    if (key === 'updated_date') {
      return `${key} > ? AND ${key} < date(?, '+1 day')`
    }

    return `${key} = ?`
  })
    .toString()
    .replace(/,/g, ' AND ')
    .replace(/date\(\? AND/, 'date(?,')
}

class People {
  save (channel, channelId, data) {
    const _data = transformObjectToRow(_.clone(data))

    const keys = _.keys(_data)
    const values = _.values(_data)

    return Promise.resolve()
      .then(() => this.findByChannelAndChannelId(channel, channelId))
      .then((person) => {
        if (person) {
          if (_.includes(keys, 'updated_date')) {
            const index = _.indexOf(keys, 'updated_date')
            values[ index ] = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
          } else {
            keys.push('updated_date')
            values.push(new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''))
          }

          return SQLite.run(`UPDATE people SET ${keys.map((key) => `${key} = ?`)} WHERE channel = ? AND channel_id = ?`, values.concat([ channel, channelId ]))
        } else {
          return SQLite.run(`INSERT INTO people (${keys}) VALUES (${values.map(() => '?')})`, values)
            .catch((error) => {
              if (error.code !== 'SQLITE_CONSTRAINT') {
                throw error
              }
            })
        }
      })
      .then(() => this.findByChannelAndChannelId(channel, channelId))
  }

  findAll (page = 1, limit = 25, criteria, sort = 'last_checked_out_date') {
    const offset = (page - 1) * limit

    let queryResults
    let queryTotalCount
    let params = []
    if (!_.isEmpty(criteria)) {
      const _criteria = transformObjectToRow(_.clone(criteria))

      const keys = _.keys(_criteria)
      const values = _.values(_criteria)

      const where = buildWhereClause(keys, values)

      queryResults = `SELECT * FROM people WHERE ${where} ORDER BY ${sort} DESC LIMIT ${limit} OFFSET ${offset}`
      queryTotalCount = `SELECT COUNT(*) as count FROM people WHERE ${where}`
      params = params.concat(values)
    } else {
      queryResults = `SELECT * FROM people ORDER BY ${sort} DESC LIMIT ${limit} OFFSET ${offset}`
      queryTotalCount = 'SELECT COUNT(*) as count FROM people'
    }

    return Promise.props({
      results: queryAll.bind(this)(queryResults, params),
      totalCount: SQLite.get(queryTotalCount, params).then(({ count }) => count)
    })
      .catch((error) => {
        if (error.code !== 'SQLITE_ERROR') {
          throw error
        }

        return { results: [], totalCount: 0 }
      })
  }

  findById (id) {
    return SQLite.get('SELECT * FROM people WHERE id = ?', [ id ])
      .then((row) => transformRowToObject(row))
  }

  findByChannelAndChannelId (channel, channelId) {
    return SQLite.get('SELECT * FROM people WHERE channel = ? AND channel_id = ?', [ channel, channelId ])
      .then((row) => transformRowToObject(row))
  }
}

module.exports = new People()
