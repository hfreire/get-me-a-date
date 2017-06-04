/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

const _ = require('lodash')

const SQLite = require('./sqlite')

const queryAllChannels = function (query) {
  return SQLite.all(query)
    .mapSeries((row) => transformRowToObject(row))
}

const transformRowToObject = function (row) {
  if (!row) {
    return
  }

  row.created_date = new Date(row.created_date)
  row.updated_date = new Date(row.updated_date)
  row.last_activity_date = new Date(row.last_activity_date)

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

  if (object.last_activity_date instanceof Date) {
    object.last_activity_date = object.last_activity_date.toISOString().replace(/T/, ' ').replace(/\..+/, '')
  }

  return object
}

class Channels {
  save (name, data) {
    const _data = transformObjectToRow(_.clone(data))
    const keys = _.keys(_data)
    const values = _.values(_data)

    return Promise.resolve()
      .then(() => this.findByName(name))
      .then((auth) => {
        if (auth) {
          keys.push('updated_date')
          values.push(new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''))

          return SQLite.run(`UPDATE channel SET ${keys.map((key) => `${key} = ?`)} WHERE name = ?`, values.concat([ name ]))
        } else {
          return SQLite.run(`INSERT INTO channel (${keys}) VALUES (${values.map(() => '?')})`, values)
            .catch((error) => {
              if (error.code !== 'SQLITE_CONSTRAINT') {
                throw error
              }
            })
        }
      })
      .then(() => transformRowToObject(_data))
  }

  findAll () {
    return queryAllChannels.bind(this)(`SELECT * FROM channel`)
  }

  findByName (name) {
    return SQLite.get('SELECT * FROM channel WHERE name = ?', [ name ])
      .then((channel) => transformRowToObject(channel))
  }

  deleteByName (name) {
    return SQLite.run('DELETE FROM channel WHERE name = ?', [ name ])
  }
}

module.exports = new Channels()
