/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

const _ = require('lodash')

const SQLite = require('./sqlite')

class Auth {
  save (id, data) {
    const _data = _.clone(data)

    if (_data.created_date instanceof Date) {
      _data.created_date = _data.created_date.toISOString().replace(/T/, ' ').replace(/\..+/, '')
    }

    if (_data.updated_date instanceof Date) {
      _data.updated_date = _data.updated_date.toISOString().replace(/T/, ' ').replace(/\..+/, '')
    }

    const keys = _.keys(_data)
    const values = _.values(_data)

    return Promise.resolve()
      .then(() => this.findById(id))
      .then((auth) => {
        if (auth) {
          keys.push('updated_date')
          values.push(new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''))

          return SQLite.run(`UPDATE auth SET ${keys.map((key) => `${key} = ?`)} WHERE id = ?`, values.concat([ id ]))
        } else {
          return SQLite.run(`INSERT INTO auth (${keys}) VALUES (${values.map(() => '?')})`, values)
            .then((_this) => _.merge(_data, { id: _this.lastID }))
            .catch((error) => {
              if (error.code !== 'SQLITE_CONSTRAINT') {
                throw error
              }
            })
        }
      })
  }

  findById (id) {
    return SQLite.get('SELECT * FROM auth WHERE id = ?', [ id ])
      .then((channel) => {
        if (!channel) {
          return
        }

        channel.created_date = new Date(channel.created_date)

        return channel
      })
  }

  deleteById (id) {
    return SQLite.run('DELETE FROM auth WHERE id = ?', [ id ])
  }
}

module.exports = new Auth()
