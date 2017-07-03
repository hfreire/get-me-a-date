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
      settings: this._sequelize.define('settings', {
        id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        isOverride: { type: Sequelize.BOOLEAN, defaultValue: false },
        likePhotosThreshold: { type: Sequelize.FLOAT, defaultValue: 80.0 }
      })
    }
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
