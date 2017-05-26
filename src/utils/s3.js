/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

const _ = require('lodash')
const Promise = require('bluebird')

const AWS = require('aws-sdk')

const defaultOptions = {}

class S3 {
  constructor (options = {}) {
    this.options = _.defaults(options, defaultOptions)

    const { region, accessKeyId, secretAccessKey } = this.options
    AWS.config.update({ region, accessKeyId, secretAccessKey })

    this.s3 = Promise.promisifyAll(new AWS.S3())
  }

  putObject (key, data) {
    if (!key || !data) {
      return Promise.reject(new Error('invalid arguments'))
    }

    const params = { Bucket: this.options.bucket, Key: key, Body: data }

    return this.s3.putObjectAsync(params)
  }

  getObject (key) {
    if (!key) {
      return Promise.reject(new Error('invalid arguments'))

    }

    const params = { Bucket: this.options.bucket, Key: key }

    return this.s3.getObjectAsync(params)
  }

  listObjects (prefix, maxKeys = 1000) {
    if (!prefix) {
      return Promise.reject(new Error('invalid arguments'))
    }

    return this.s3.listObjectsAsync({
      Bucket: this.options.bucket,
      Prefix: prefix,
      MaxKeys: maxKeys
    })
      .then((data) => {
        return _(data.Contents)
          .filter(({ Key }) => Key.split(`${prefix}/`).length > 1 && Key.split(`${prefix}/`)[ 1 ] !== '')
          .map(({ Key }) => Key.split(`${prefix}/`)[ 1 ])
          .value()
      })
  }
}

module.exports = S3
