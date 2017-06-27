/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

const Database = require('./database')

class Messages extends Database {
  constructor () {
    super('messages', [ 'channel', 'channel_message_id' ])
  }

  _transformRowToObject (row) {
    const _row = super._transformRowToObject(row)

    if (!_row) {
      return
    }

    if (_row.sent_date) {
      _row.sent_date = new Date(_row.sent_date)
    }

    return _row
  }

  _transformObjectToRow (object) {
    const _object = super._transformObjectToRow(object)

    if (!_object) {
      return
    }

    if (_object.sent_date instanceof Date) {
      _object.sent_date = _object.sent_date.toISOString()
    }

    return _object
  }

  findByChannelNameAndChannelMessageId (channelName, channeMessageId) {
    return this._findByPrimaryKeys([ channelName, channeMessageId ])
  }
}

module.exports = new Messages()
