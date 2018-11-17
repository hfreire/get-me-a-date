/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE.md file in the root directory of this source tree.
 */

const _ = require('lodash')
const Promise = require('bluebird')

const { Tinder, Happn, Mint } = require('../channels')
const Database = require('../database')

class Channel {
  constructor () {
    this._channels = {
      'tinder': Tinder,
      'happn': Happn,
      'mint': Mint
    }
  }

  start () {
    const initChannels = () => {
      return Promise.mapSeries(_.keys(this._channels), (name) => this._channels[ name ].init())
    }

    const authorizeChannels = () => {
      return Database.channels.findAll()
        .mapSeries(({ name, isEnabled }) => {
          if (!isEnabled || !this._channels[ name ]) {
            return
          }

          return this._channels[ name ].authorize()
        })
    }

    return initChannels()
      .then(() => authorizeChannels())
  }

  getByName (name) {
    return Promise.try(() => {
      if (!name) {
        throw new Error('invalid arguments')
      }

      if (!this._channels[ name ]) {
        throw new Error(`channel ${name} not found`)
      }

      return this._channels[ name ]
    })
  }
}

module.exports = new Channel()
