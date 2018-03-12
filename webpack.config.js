/*
 * Copyright (c) 2018, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE.md file in the root directory of this source tree.
 */

const CommonsChunkPlugin = require('webpack/lib/optimize/CommonsChunkPlugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const ContextReplacementPlugin = require('webpack/lib/ContextReplacementPlugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const NamedModulesPlugin = require('webpack/lib/NamedModulesPlugin')
const EnvironmentPlugin = require('webpack/lib/EnvironmentPlugin')

const { resolve } = require('path')

module.exports = {
  entry: {
    polyfills: './src/web/polyfills.ts',
    main: './src/web/main.ts'
  },
  output: {
    filename: '[name].js',
    path: resolve(__dirname, 'tmp/web')
  },
  resolve: {
    extensions: [ '.ts', '.js', '.json' ]
  },
  module: {
    rules: [
      { test: /\.ts$/, use: [ '@angularclass/hmr-loader', 'awesome-typescript-loader', 'angular2-template-loader' ] },
      { test: /\.json$/, use: 'json-loader' },
      { test: /\.scss$/, use: [ 'style-loader', 'css-loader', 'sass-loader' ] },
      { test: /\.html$/, use: 'raw-loader' },
      { test: /\.(jpg|png|gif)$/, use: 'file-loader' },
      { test: /\.(eot|woff2?|svg|ttf)([?]?.*)$/, use: 'file-loader' }
    ]
  },
  plugins: [
    new CommonsChunkPlugin({ name: 'polyfills', chunks: [ 'polyfills' ] }),
    new HtmlWebpackPlugin({
      template: 'src/web/index.html',
      chunksSortMode: (a, b) => { // TODO: https://github.com/AngularClass/angular-starter/issues/353
        const order = [ 'polyfills', 'main' ]
        return order.indexOf(a.names[ 0 ]) - order.indexOf(b.names[ 0 ])
      }
    }),
    new ContextReplacementPlugin(/angular(\\|\/)core(\\|\/)@angular/, resolve(__dirname, 'src'), {}),
    new CopyWebpackPlugin([ { from: 'src/web/assets/images', to: 'assets/images' } ]),
    new NamedModulesPlugin(),
    new EnvironmentPlugin([ 'NODE_ENV', 'BASE_API_URL' ])
  ],
  node: {
    global: true,
    crypto: 'empty',
    process: true,
    module: false,
    clearImmediate: false,
    setImmediate: false
  }
}
