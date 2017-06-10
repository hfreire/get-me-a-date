/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

const Database = require('./database')

const _ = require('lodash')
const Promise = require('bluebird')

const SQLite = require('./sqlite')

const uuidV4 = require('uuid/v4')

const buildWhereClause = (keys, values) => {
  if (_.includes(keys, 'decision_date')) {
    const index = _.indexOf(keys, 'decision_date')
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
    if (key === 'decision_date') {
      return `${key} > ? AND ${key} < strftime('%Y-%m-%dT%H:%M:%fZ', datetime(?, '+1 day'))`
    }

    if (key === 'matched_date') {
      return `${key} > ? AND ${key} < strftime('%Y-%m-%dT%H:%M:%fZ', datetime(?, '+1 day'))`
    }

    if (key === 'trained_date') {
      return `${key} < strftime('%Y-%m-%dT%H:%M:%fZ', datetime(?, '+1 day'))`
    }

    if (key === 'last_checked_out_date') {
      return `${key} > ? AND ${key} < strftime('%Y-%m-%dT%H:%M:%fZ', datetime(?, '+1 day'))`
    }

    return `${key} = ?`
  })
    .toString()
    .replace(/,/g, ' AND ')
    .replace(/datetime\(\? AND/, 'datetime(?,')
    // eslint-disable-next-line no-regex-spaces
    .replace(/AND  datetime/, ', datetime')
}

const buildSelectClause = (unique, select) => {
  if (unique && _.includes(select, 'decision_date')) {
    const index = _.indexOf(select, 'decision_date')
    select[ index ] = `strftime('%Y-%m-%d',${select[ index ]}) AS decision_date`
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

class Recommendations extends Database {
  constructor () {
    super('recommendations', [ 'channel', 'channel_id' ])
  }

  _transformRowToObject (row) {
    const _row = super._transformRowToObject(row)

    if (!_row) {
      return
    }

    if (_row.decision_date) {
      _row.decision_date = new Date(_row.decision_date)
    }

    if (_row.matched_date) {
      _row.matched_date = new Date(_row.matched_date)
    }

    if (_row.trained_date) {
      _row.trained_date = new Date(_row.trained_date)
    }

    if (_row.last_checked_out_date) {
      _row.last_checked_out_date = new Date(_row.last_checked_out_date)
    }

    if (_row.data) {
      _row.data = JSON.parse(_row.data)
    }

    _row.like = !!_row.like
    _row.is_pass = !!_row.is_pass
    _row.is_human_decision = !!_row.is_human_decision
    _row.train = !!_row.train

    return _row
  }

  _transformObjectToRow (object) {
    const _object = super._transformObjectToRow(object)

    if (!_object) {
      return
    }

    if (_object.decision_date instanceof Date) {
      _object.decision_date = _object.decision_date.toISOString()
    }

    if (_object.matched_date instanceof Date) {
      _object.matched_date = _object.matched_date.toISOString()
    }

    if (_object.trained_date instanceof Date) {
      _object.trained_date = _object.trained_date.toISOString()
    }

    if (_object.last_checked_out_date instanceof Date) {
      _object.last_checked_out_date = _object.last_checked_out_date.toISOString()
    }

    if (_object.data) {
      _object.data = JSON.stringify(_object.data)
    }

    return _object
  }

  save (primaryKeyValues, data) {
    const _data = this._transformObjectToRow(_.clone(data))

    const keys = _.keys(_data)
    const values = _.values(_data)

    return Promise.resolve()
      .then(() => this._findByPrimaryKeys(primaryKeyValues))
      .then((person) => {
        if (person) {
          if (_.includes(keys, 'updated_date')) {
            const index = _.indexOf(keys, 'updated_date')
            values[ index ] = new Date().toISOString()
          } else {
            keys.push('updated_date')
            values.push(new Date().toISOString())
          }

          return SQLite.run(`UPDATE ${this.name} SET ${keys.map((key) => `${key} = ?`)} WHERE channel = ? AND channel_id = ?`, values.concat(primaryKeyValues))
        } else {
          keys.push('id')
          values.push(uuidV4())

          return SQLite.run(`INSERT INTO ${this.name} (${keys}) VALUES (${values.map(() => '?')})`, values)
            .catch((error) => {
              if (error.code !== 'SQLITE_CONSTRAINT') {
                throw error
              }
            })
        }
      })
      .then(() => this._findByPrimaryKeys(primaryKeyValues))
  }

  findAll (page = 1, limit = 25, criteria = {}, select = [ '*' ], sort = 'last_checked_out_date', unique = false) {
    const offset = (page - 1) * limit

    let queryResults
    let queryTotalCount
    let params = []
    let _select = buildSelectClause(unique, select)
    if (!_.isEmpty(criteria)) {
      const _criteria = this._transformObjectToRow(_.clone(criteria))

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
      results: this._findAll(queryResults, params),
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
    return this._findByKeys([ 'id' ], id)
  }

  findByChannelAndChannelId (channel, channelId) {
    return this._findByPrimaryKeys([ channel, channelId ])
  }
}

module.exports = new Recommendations()
