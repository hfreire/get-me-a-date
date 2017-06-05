/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

const _ = require('lodash')
const Promise = require('bluebird')

const { Messages } = require('../database')

class Message {
  readMessages (channel, accountUserId, recommendationId, messages) {
    return Promise.try(() => {
      const _messages = []

      _.forEach(messages, ({ _id, message, from, sent_date }) => {
        const _message = {
          channel: channel.name,
          channel_message_id: _id,
          recommendation_id: recommendationId,
          sent_date: new Date(sent_date.replace(/T/, ' ').replace(/\..+/, '')),
          text: message,
          is_from_recommendation: from !== accountUserId
        }
        _messages.push(_message)
      })

      return _messages
    })
      .mapSeries((message) => Messages.save(message.channel, message.channel_message_id, message))
  }
}

module.exports = new Message()
