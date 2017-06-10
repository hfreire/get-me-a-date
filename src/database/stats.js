/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

const Database = require('./database')

const SQLite = require('./sqlite')

class Stats extends Database {
  constructor () {
    super('stats', [ 'date' ])
  }

  _transformRowToObject (row) {
    const _row = super._transformRowToObject(row)

    if (!_row) {
      return
    }

    if (_row.date) {
      _row.date = new Date(_row.date)
    }

    return _row
  }

  _transformObjectToRow (object) {
    const _object = super._transformObjectToRow(object)

    if (!_object) {
      return
    }

    if (_object.date instanceof Date) {
      _object.date = _object.date.toISOString().replace(/T.*$/, '')
    }

    return _object
  }

  findAll (page = 1, limit = 31) {
    return this._findPage(page, limit)
  }

  findByDate (date) {
    const _date = date instanceof Date ? date.toISOString().replace(/T.*$/, '') : date

    return this._findByPrimaryKeys([ _date ])
  }

  findAllByDateRange (start, end) {
    const _start = start instanceof Date ? start.toISOString().replace(/T.*$/, '') : start
    const _end = end instanceof Date ? end.toISOString().replace(/T.*$/, '') : end

    return SQLite.get('SELECT * FROM stats WHERE date >= ? AND date <= ?', [ _start, _end ])
      .then((row) => this._transformRowToObject(row))
  }

  deleteByDate (date) {
    const _date = date instanceof Date ? date.toISOString().replace(/T.*$/, '') : date

    return this._findByPrimaryKeys([ _date ])
  }
}

module.exports = new Stats()
