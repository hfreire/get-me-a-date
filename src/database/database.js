/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

const _ = require('lodash')

const SQLite = require('./sqlite')

class Database {
  constructor (name, primaryKeys) {
    this._name = name
    this._primaryKeys = primaryKeys
  }

  get name () {
    return this._name
  }

  get primaryKeys () {
    return this._primaryKeys
  }

  _transformRowToObject (row) {
    if (!row) {
      return
    }

    if (row.created_date) {
      row.created_date = new Date(row.created_date)
    }

    if (row.updated_date) {
      row.updated_date = new Date(row.updated_date)
    }

    return row
  }

  _transformObjectToRow (object) {
    if (!object) {
      return
    }

    if (object.created_date instanceof Date) {
      object.created_date = object.created_date.toISOString()
    }

    if (object.updated_date instanceof Date) {
      object.updated_date = object.updated_date.toISOString()
    }

    return object
  }

  _queryAllChannels (query) {
    return SQLite.all(query)
      .mapSeries((row) => this._transformRowToObject(row))
  }

  _findByPrimaryKeys (values) {
    return this._findByKeys(this._primaryKeys, values)
  }

  _findByKeys (keys, values) {
    return SQLite.get(`SELECT * FROM ${this.name} WHERE ${keys.map((key) => `${key} = ?`).toString().replace(',', ' AND ')}`, values)
      .then((row) => this._transformRowToObject(row))
  }

  _deleteByPrimaryKeys (values) {
    return this._deleteByKeys(this._primaryKeys, values)
  }

  _deleteByKeys (keys, values) {
    return SQLite.run(`DELETE FROM ${this.name} WHERE ${keys.map((key) => `${key} = ?`).toString().replace(',', ' AND ')}`, values)
  }

  findAll () {
    return this._queryAllChannels.bind(this)(`SELECT * FROM ${this.name}`)
  }

  findById (id) {
    return this._findByPrimaryKeys([ id ])
  }

  save (primaryKeyValues = [], data) {
    const _data = this._transformObjectToRow(_.clone(data))
    const keys = _.keys(_data)
    const values = _.values(_data)

    return Promise.resolve()
      .then(() => this._findByPrimaryKeys(primaryKeyValues))
      .then((auth) => {
        if (auth) {
          keys.push('updated_date')
          values.push(new Date().toISOString())

          return SQLite.run(`UPDATE ${this.name} SET ${keys.map((key) => `${key} = ?`)} WHERE ${this._primaryKeys.map((key) => `${key} = ?`).toString().replace(',', ' AND ')}`, values.concat(primaryKeyValues))
        } else {
          return SQLite.run(`INSERT INTO ${this.name} (${keys}) VALUES (${values.map(() => '?')})`, values)
            .then((_this) => {
              if (_this.lastID) {
                _.merge(_data, { id: _this.lastID })
              }
            })
            .catch((error) => {
              if (error.code !== 'SQLITE_CONSTRAINT') {
                throw error
              }
            })
        }
      })
      .then(() => this._transformRowToObject(_data))
  }

  deleteById (id) {
    return this._deleteByPrimaryKeys([ id ])
  }
}

module.exports = Database
