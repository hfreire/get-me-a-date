/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

const Promise = require('bluebird')

const { Messages } = require('../../databases')

class Message {
  readMessages (messages) {
    return Promise.mapSeries(messages, (message) => {
      return Messages.save([ message.channel, message.channel_message_id ], message)
    })
  }
}

module.exports = new Message()
