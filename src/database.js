/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

const _ = require('lodash')
const Promise = require('bluebird')

const Sequelize = require('sequelize')

const { join } = require('path')

class Database {
  constructor () {
    this._sequelize = new Sequelize(null, null, null, {
      dialect: 'sqlite',
      pool: { max: 5, min: 0, idle: 10000 },
      storage: join(__dirname, '../tmp/get-me-a-date.db'),
      logging: false
    })

    this._models = {
      stats: this._sequelize.define('stats', {
        date: { type: Sequelize.DATEONLY, primaryKey: true, allowNull: false },
        machineLikes: { type: Sequelize.INTEGER, defaultValue: 0, allowNull: false },
        humanLikes: { type: Sequelize.INTEGER, defaultValue: 0, allowNull: false },
        machinePasses: { type: Sequelize.INTEGER, defaultValue: 0, allowNull: false },
        humanPasses: { type: Sequelize.INTEGER, defaultValue: 0, allowNull: false },
        trains: { type: Sequelize.INTEGER, defaultValue: 0, allowNull: false },
        matches: { type: Sequelize.INTEGER, defaultValue: 0, allowNull: false },
        skips: { type: Sequelize.INTEGER, defaultValue: 0, allowNull: false }
      }),
      messages: this._sequelize.define('messages', {
        channelName: { type: Sequelize.STRING, primaryKey: true, allowNull: false },
        channelMessageId: { type: Sequelize.BOOLEAN, primaryKey: true, allowNull: false },
        recommendationId: { type: Sequelize.STRING, allowNull: false },
        isFromRecommendation: { type: Sequelize.BOOLEAN, allowNull: false },
        sentDate: { type: Sequelize.DATE, allowNull: false },
        text: { type: Sequelize.TEXT, allowNull: false }
      }),
      channels: this._sequelize.define('channels', {
        name: { type: Sequelize.STRING, primaryKey: true },
        isEnabled: { type: Sequelize.BOOLEAN, defaultValue: false },
        userId: { type: Sequelize.STRING, defaultValue: false },
        accessToken: { type: Sequelize.TEXT, defaultValue: null },
        lastActivityDate: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
        isOutOfLikes: { type: Sequelize.BOOLEAN, defaultValue: false },
        isOutOfLikesDate: { type: Sequelize.DATE, defaultValue: null }
      }),
      settings: this._sequelize.define('settings', {
        id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        isOverride: { type: Sequelize.BOOLEAN, defaultValue: false },
        likePhotosThreshold: { type: Sequelize.FLOAT, defaultValue: 80.0 }
      })
    }
  }

  get stats () {
    return this._models[ 'stats' ]
  }

  get messages () {
    return this._models[ 'messages' ]
  }

  get channels () {
    return this._models[ 'channels' ]
  }

  get settings () {
    return this._models[ 'settings' ]
  }

  start () {
    return this._sequelize.authenticate()
      .then(() => {
        return Promise.mapSeries(_.keys(this._models), (modelName) => this._models[ modelName ].sync())
      })
  }
}

module.exports = new Database()
