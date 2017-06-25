/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

const _ = require('lodash')
const Promise = require('bluebird')

const { Tinder, Happn } = require('../channels')
const { SQLite, Channels } = require('../database')

class Channel {
  constructor () {
    this._channels = {
      'tinder': Tinder,
      'happn': Happn
    }
  }

  bootstrap () {
    const initChannels = () => {
      return SQLite.start()
        .then(() => Promise.mapSeries(_.keys(this._channels), (name) => this._channels[ name ].init()))
    }

    const authorizeChannels = () => {
      return Channels.findAll()
        .mapSeries(({ name, is_enabled }) => {
          // eslint-disable-next-line camelcase
          if (!is_enabled || !this._channels[ name ]) {
            return
          }

          return this._channels[ name ].authorize()
        })
    }

    return initChannels()
      .then(() => authorizeChannels())
  }

  getByName (name) {
    if (!name) {
      throw new Error('invalid arguments')
    }

    if (!this._channels[ name ]) {
      throw new Error(`channel ${name} not found`)
    }

    return this._channels[ name ]
  }
}

module.exports = new Channel()
