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
    .mapSeries((channel) => transformRowToChannel(channel))
}

const transformRowToChannel = function (row) {
  if (!row) {
    return
  }

  row.created_date = new Date(row.created_date)
  row.updated_date = new Date(row.created_date)

  return row
}

const transformChannelToRow = function (channel) {
  if (!channel) {
    return
  }

  if (channel.created_date instanceof Date) {
    channel.created_date = channel.created_date.toISOString().replace(/T/, ' ').replace(/\..+/, '')
  }

  if (channel.updated_date instanceof Date) {
    channel.updated_date = channel.updated_date.toISOString().replace(/T/, ' ').replace(/\..+/, '')
  }

  return channel
}

class Channel {
  save (name, data) {
    const _data = transformChannelToRow(_.clone(data))
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
      .then(() => transformRowToChannel(_data))
  }

  findAll () {
    return queryAllChannels.bind(this)(`SELECT * FROM channel`)
  }

  findByName (name) {
    return SQLite.get('SELECT * FROM channel WHERE name = ?', [ name ])
      .then((channel) => transformRowToChannel(channel))
  }

  deleteByName (name) {
    return SQLite.run('DELETE FROM channel WHERE name = ?', [ name ])
  }
}

module.exports = new Channel()
