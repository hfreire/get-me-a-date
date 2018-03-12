/*
 * Copyright (c) 2018, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE.md file in the root directory of this source tree.
 */

const WEBPACK_DEV_PORT = process.env.WEBPACK_DEV_PORT || 300

const webpackMerge = require('webpack-merge')

const commonConfig = require('./webpack.config')

module.exports = webpackMerge(commonConfig, {
  devServer: {
    port: WEBPACK_DEV_PORT,
    host: '0.0.0.0',
    historyApiFallback: true,
    stats: 'minimal'
  }
})
