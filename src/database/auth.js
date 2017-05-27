/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

const _ = require('lodash')

const SQLite = require('./sqlite')

class Auth {
  save (provider, data) {
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
      .then(() => this.findByProvider(provider))
      .then((auth) => {
        if (auth) {
          keys.push('updated_date')
          values.push(new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''))

          return SQLite.run(`UPDATE auth SET ${keys.map((key) => `${key} = ?`)} WHERE provider = ?`, values.concat([ provider ]))
        } else {
          return SQLite.run(`INSERT INTO auth (${keys}) VALUES (${values.map(() => '?')})`, values)
            .catch((error) => {
              if (error.code !== 'SQLITE_CONSTRAINT') {
                throw error
              }
            })
        }
      })
  }

  findByProvider (provider) {
    return SQLite.get('SELECT * FROM auth WHERE provider = ?', [ provider ])
      .then((authentication) => {
        if (!authentication) {
          return
        }

        authentication.created_date = new Date(authentication.created_date)

        return authentication
      })
  }

  deleteByProvider (provider) {
    return SQLite.run('DELETE FROM auth WHERE provider = ?', [ provider ])
  }
}

module.exports = new Auth()
