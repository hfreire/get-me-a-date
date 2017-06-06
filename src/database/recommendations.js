/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

const _ = require('lodash')
const Promise = require('bluebird')

const SQLite = require('./sqlite')

const uuidV4 = require('uuid/v4')

const transformRowToObject = function (row) {
  if (!row) {
    return
  }

  if (row.created_date) {
    row.created_date = new Date(row.created_date)
  }

  if (row.updated_date) {
    row.updated_date = new Date(row.updated_date)
  }

  if (row.liked_date) {
    row.liked_date = new Date(row.liked_date)
  }

  if (row.matched_date) {
    row.matched_date = new Date(row.matched_date)
  }

  if (row.trained_date) {
    row.trained_date = new Date(row.trained_date)
  }

  if (row.last_checked_out_date) {
    row.last_checked_out_date = new Date(row.last_checked_out_date)
  }

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
    object.created_date = object.created_date.toISOString()
  }

  if (object.updated_date instanceof Date) {
    object.updated_date = object.updated_date.toISOString()
  }

  if (object.matched_date instanceof Date) {
    object.matched_date = object.matched_date.toISOString()
  }

  if (object.liked_date instanceof Date) {
    object.liked_date = object.liked_date.toISOString()
  }

  if (object.trained_date instanceof Date) {
    object.trained_date = object.trained_date.toISOString()
  }

  if (object.last_checked_out_date instanceof Date) {
    object.last_checked_out_date = object.last_checked_out_date.toISOString()
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
  if (_.includes(keys, 'liked_date')) {
    const index = _.indexOf(keys, 'liked_date')
    values[ index ] = values[ index ].split(' ')[ 0 ]
    values.splice(index, 0, values[ index ])
  }

  if (_.includes(keys, 'matched_date')) {
    const index = _.indexOf(keys, 'matched_date')
    values[ index ] = values[ index ].split(' ')[ 0 ]
    values.splice(index, 0, values[ index ])
  }

  if (_.includes(keys, 'last_checked_out_date')) {
    const index = _.indexOf(keys, 'last_checked_out_date')
    values[ index ] = values[ index ].split(' ')[ 0 ]
    values.splice(index, 0, values[ index ])
  }

  return keys.map((key) => {
    if (key === 'liked_date') {
      return `${key} > ? AND ${key} < date(?, '+1 day')`
    }

    if (key === 'matched_date') {
      return `${key} > ? AND ${key} < date(?, '+1 day')`
    }

    if (key === 'trained_date') {
      return `${key} < date(?, '+1 day')`
    }

    if (key === 'last_checked_out_date') {
      return `${key} > ? AND ${key} < date(?, '+1 day')`
    }

    return `${key} = ?`
  })
    .toString()
    .replace(/,/g, ' AND ')
    .replace(/date\(\? AND/, 'date(?,')
}

const buildSelectClause = (unique, select) => {
  if (unique && _.includes(select, 'liked_date')) {
    const index = _.indexOf(select, 'liked_date')
    select[ index ] = `strftime('%Y-%m-%d',${select[ index ]}) AS liked_date`
  }

  if (unique && _.includes(select, 'matched_date')) {
    const index = _.indexOf(select, 'matched_date')
    select[ index ] = `strftime('%Y-%m-%d',${select[ index ]}) AS matched_date`
  }

  if (unique && _.includes(select, 'trained_date')) {
    const index = _.indexOf(select, 'trained_date')
    select[ index ] = `strftime('%Y-%m-%d',${select[ index ]}) AS trained_date`
  }

  if (unique && _.includes(select, 'last_checked_out_date')) {
    const index = _.indexOf(select, 'last_checked_out_date')
    select[ index ] = `strftime('%Y-%m-%d',${select[ index ]}) AS last_checked_out_date`
  }

  return select
}

class Recommendations {
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
            values[ index ] = new Date().toISOString()
          } else {
            keys.push('updated_date')
            values.push(new Date().toISOString())
          }

          return SQLite.run(`UPDATE recommendations SET ${keys.map((key) => `${key} = ?`)} WHERE channel = ? AND channel_id = ?`, values.concat([ channel, channelId ]))
        } else {
          keys.push('id')
          values.push(uuidV4())

          return SQLite.run(`INSERT INTO recommendations (${keys}) VALUES (${values.map(() => '?')})`, values)
            .catch((error) => {
              if (error.code !== 'SQLITE_CONSTRAINT') {
                throw error
              }
            })
        }
      })
      .then(() => this.findByChannelAndChannelId(channel, channelId))
  }

  findAll (page = 1, limit = 25, criteria = {}, select = [ '*' ], sort = 'last_checked_out_date', unique = false) {
    const offset = (page - 1) * limit

    let queryResults
    let queryTotalCount
    let params = []
    let _select = buildSelectClause(unique, select)
    if (!_.isEmpty(criteria)) {
      const _criteria = transformObjectToRow(_.clone(criteria))

      const keys = _.keys(_criteria)
      const values = _.values(_criteria)

      const where = buildWhereClause(keys, values)

      queryResults = `SELECT ${unique ? 'DISTINCT' : ''} ${_select} FROM recommendations WHERE ${where} ORDER BY ${sort} DESC LIMIT ${limit} OFFSET ${offset}`
      queryTotalCount = `SELECT ${unique ? 'DISTINCT' : ''} COUNT(*) as count FROM recommendations WHERE ${where}`
      params = params.concat(values)
    } else {
      queryResults = `SELECT ${unique ? 'DISTINCT' : ''} ${_select} FROM recommendations ORDER BY ${sort} DESC LIMIT ${limit} OFFSET ${offset}`
      queryTotalCount = `SELECT ${unique ? 'DISTINCT' : ''} COUNT(*) as count FROM recommendations`
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
    return SQLite.get('SELECT * FROM recommendations WHERE id = ?', [ id ])
      .then((row) => transformRowToObject(row))
  }

  findByChannelAndChannelId (channel, channelId) {
    return SQLite.get('SELECT * FROM recommendations WHERE channel = ? AND channel_id = ?', [ channel, channelId ])
      .then((row) => transformRowToObject(row))
  }
}

module.exports = new Recommendations()
