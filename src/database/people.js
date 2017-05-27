/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

const _ = require('lodash')

const SQLite = require('./sqlite')

const queryAllPeople = function (query) {
  return SQLite.all(query)
    .mapSeries((row) => {
      row.created_date = new Date(row.created_date)
      row.data = JSON.parse(row.data)
      return row
    })
}

class People {
  save (provider, providerId, data) {
    const _data = _.clone(data)

    if (_data.created_date instanceof Date) {
      _data.created_date = _data.created_date.toISOString().replace(/T/, ' ').replace(/\..+/, '')
    }

    if (_data.updated_date instanceof Date) {
      _data.updated_date = _data.updated_date.toISOString().replace(/T/, ' ').replace(/\..+/, '')
    }

    if (_data.data) {
      _data.data = JSON.stringify(_data.data)
    }

    const keys = _.keys(_data)
    const values = _.values(_data)

    return Promise.resolve()
      .then(() => this.findByProviderAndProviderId(provider, providerId))
      .then((person) => {
        if (person) {
          keys.push('updated_date')
          values.push(new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''))

          return SQLite.run(`UPDATE people SET ${keys.map((key) => `${key} = ?`)} WHERE provider = ? AND provider_id = ?`, values.concat([ provider, providerId ]))
        } else {
          return SQLite.run(`INSERT INTO people (${keys}) VALUES (${values.map(() => '?')})`, values)
            .catch((error) => {
              if (error.code !== 'SQLITE_CONSTRAINT') {
                throw error
              }
            })
        }
      })
  }

  findAll () {
    return queryAllPeople.bind(this)('SELECT * FROM people ORDER BY created_date DESC')
  }

  findById (id) {
    return SQLite.get('SELECT * FROM people WHERE id = ?', [ id ])
      .then((person) => {
        if (!person) {
          return
        }

        person.created_date = new Date(person.created_date)
        person.data = JSON.parse(person.data)

        return person
      })
  }

  findByProviderAndProviderId (provider, providerId) {
    return SQLite.get('SELECT * FROM people WHERE provider = ? AND provider_id = ?', [ provider, providerId ])
      .then((person) => {
        if (!person) {
          return
        }

        person.created_date = new Date(person.created_date)
        person.data = JSON.parse(person.data)

        return person
      })
  }
}

module.exports = new People()
