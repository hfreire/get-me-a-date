/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

const Promise = require('bluebird')

const sqlite3 = require('sqlite3')

const { mkdirAsync, existsSync } = Promise.promisifyAll(require('fs'))

const { join } = require('path')

const createFile = function () {
  return Promise.resolve()
    .then(() => {
      const path = join(__dirname, '../tmp/')

      if (!existsSync(path)) {
        return mkdirAsync(path)
      }
    })
    .then(() => {
      return new Promise((resolve, reject) => {
        const path = join(__dirname, '../tmp/get-me-a-tinder-date.db')
        const options = sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE
        const callback = (error) => {
          if (error) {
            reject(error)

            return
          }

          resolve()
        }

        this._database = Promise.promisifyAll(new sqlite3.Database(path, options, callback))
      })
    })
}

const createSchema = function () {
  return this._database.runAsync(
    'CREATE TABLE IF NOT EXISTS people (' +
    'id VARCHAR(36), ' +
    'created_date DATETIME DEFAULT CURRENT_TIMESTAMP, ' +
    'updated_date DATETIME DEFAULT CURRENT_TIMESTAMP, ' +
    'like INTEGER NOT NULL DEFAULT 0,' +
    'train INTEGER NOT NULL DEFAULT 0,' +
    'provider VARCHAR(32), ' +
    'provider_id VARCHAR(64), ' +
    'data TEXT,' +
    'PRIMARY KEY (provider, provider_id)' +
    ')')
}

const queryAllPeople = function (query) {
  return this._database.allAsync(query)
    .mapSeries((row) => {
      row.created_date = new Date(row.created_date)
      row.data = JSON.parse(row.data)
      return row
    })
}

class Database {
  start () {
    if (this._database) {
      return Promise.resolve()
    }

    return createFile.bind(this)()
      .then(() => createSchema.bind(this)())
  }

  savePeople (id, like, train, provider, providerId, data) {
    return Promise.resolve()
      .then(() => this.findPeopleById(id))
      .then((person) => {
        if (person) {
          return this._database.runAsync(
            `UPDATE people SET id = ?, updated_date = ?, like = ?, train = ?, provider = ?, provider_id = ?, data = ?`,
            [ id, new Date(), like, train, provider, providerId, JSON.stringify(data) ])
        } else {
          return this._database.runAsync(
            `INSERT INTO people (id, like, train, provider, provider_id, data) VALUES (?, ?, ?, ?, ?, ?)`,
            [ id, like, train, provider, providerId, JSON.stringify(data) ])
            .catch((error) => {
              if (error.code !== 'SQLITE_CONSTRAINT') {
                throw error
              }
            })
        }
      })
  }

  findAllPeople () {
    return queryAllPeople.bind(this)('SELECT * FROM people ORDER BY created_date DESC')
  }

  findPeopleById (id) {
    return this._database.getAsync('SELECT * FROM people WHERE id = ?', [ id ])
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

module.exports = new Database()
