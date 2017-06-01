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

  return row
}

const transformObjectToRow = function (object) {
  if (!object) {
    return
  }

  object.date = object.date.toISOString().replace(/T.*$/, '')

  if (object.created_date instanceof Date) {
    object.created_date = object.created_date.toISOString().replace(/T/, ' ').replace(/\..+/, '')
  }

  if (object.updated_date instanceof Date) {
    object.updated_date = object.updated_date.toISOString().replace(/T/, ' ').replace(/\..+/, '')
  }

  return object
}

const queryAll = function (query) {
  return SQLite.all(query)
    .mapSeries((row) => transformRowToObject(row))
}

class Stats {
  save (date, data) {
    const _data = transformObjectToRow(_.merge(_.clone(data), { date }))
    const keys = _.keys(_data)
    const values = _.values(_data)

    return Promise.resolve()
      .then(() => this.findByDate(date))
      .then((auth) => {
        if (auth) {
          keys.push('updated_date')
          values.push(new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''))

          return SQLite.run(`UPDATE stats SET ${keys.map((key) => `${key} = ?`)} WHERE date = ?`, values.concat([ _data.date ]))
        } else {
          return SQLite.run(`INSERT INTO stats (${keys}) VALUES (${values.map(() => '?')})`, values)
            .catch((error) => {
              if (error.code !== 'SQLITE_CONSTRAINT') {
                throw error
              }
            })
        }
      })
      .then(() => this.findByDate(_data.date))
  }

  findAll (page = 1, limit = 31) {
    const offset = (page - 1) * limit

    return Promise.props({
      results: queryAll.bind(this)(`SELECT * FROM stats ORDER BY date ASC LIMIT ${limit} OFFSET ${offset}`),
      totalCount: SQLite.get('SELECT COUNT(*) as count FROM stats').then(({ count }) => count)
    })
  }

  findByDate (date) {
    let _date = date
    if (date instanceof Date) {
      _date = date.toISOString().replace(/T.*$/, '')
    }

    return SQLite.get('SELECT * FROM stats WHERE date = ?', [ _date ])
      .then((stats) => transformRowToObject(stats))
  }

  findAllByDateRange (start, end) {
    let _start = start
    if (start instanceof Date) {
      _start = start.toISOString().replace(/T.*$/, '')
    }

    let _end = end
    if (end instanceof Date) {
      _end = end.toISOString().replace(/T.*$/, '')
    }

    return SQLite.get('SELECT * FROM stats WHERE date >= ? AND date <= ?', [ _start, _end ])
      .then((stats) => transformRowToObject(stats))
  }

  deleteByDate (date) {
    let _date = date
    if (date instanceof Date) {
      _date = date.toISOString().replace(/T.*$/, '')
    }

    return SQLite.run('DELETE FROM stats WHERE date = ?', [ _date ])
  }
}

module.exports = new Stats()
