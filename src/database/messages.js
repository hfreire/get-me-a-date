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
  row.sent_date = new Date(row.sent_date)

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

  if (object.sent_date instanceof Date) {
    object.sent_date = object.sent_date.toISOString().replace(/T/, ' ').replace(/\..+/, '')
  }

  return object
}

class Messages {
  save (channelName, channeMessageId, data) {
    const _data = transformObjectToRow(_.clone(data))
    const keys = _.keys(_data)
    const values = _.values(_data)

    return Promise.resolve()
      .then(() => this.findByChannelNameAndChannelMessageId(channelName, channeMessageId))
      .then((row) => {
        if (row) {
          keys.push('updated_date')
          values.push(new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''))

          return SQLite.run(`UPDATE messages SET ${keys.map((key) => `${key} = ?`)} WHERE channel = ? AND channel_message_id = ?`, values.concat([ channelName, channeMessageId ]))
        } else {
          return SQLite.run(`INSERT INTO messages (${keys}) VALUES (${values.map(() => '?')})`, values)
            .catch((error) => {
              if (error.code !== 'SQLITE_CONSTRAINT') {
                throw error
              }
            })
        }
      })
      .then(() => this.findByChannelNameAndChannelMessageId(channelName, channeMessageId))
  }

  findByChannelNameAndChannelMessageId (channelName, channeMessageId) {
    return SQLite.get('SELECT * FROM messages WHERE channel = ? AND channel_message_id = ?', [ channelName, channeMessageId ])
      .then((row) => transformRowToObject(row))
  }
}

module.exports = new Messages()
