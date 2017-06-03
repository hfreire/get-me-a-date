/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

const _ = require('lodash')
const Promise = require('bluebird')
const retry = require('bluebird-retry')
const Brakes = require('brakes')

const Health = require('health-checkup')

const AWS = require('aws-sdk')

const defaultOptions = {
  retry: { max_tries: 3, interval: 1000, timeout: 14000, throw_original: true },
  breaker: { timeout: 9000, threshold: 80, circuitDuration: 30000 }
}

class S3 {
  constructor (options = {}) {
    this._options = _.defaults(options, defaultOptions)

    const { region, accessKeyId, secretAccessKey } = this._options
    AWS.config.update({ region, accessKeyId, secretAccessKey })

    this._s3 = Promise.promisifyAll(new AWS.S3())

    this._breaker = new Brakes(this._options.breaker)

    this._s3.putObjectCircuitBreaker = this._breaker.slaveCircuit((params) => retry(() => this._s3.putObjectAsync(params), this._options.retry))
    this._s3.copyObjectCircuitBreaker = this._breaker.slaveCircuit((params) => retry(() => this._s3.copyObjectAsync(params), this._options.retry))
    this._s3.getObjectCircuitBreaker = this._breaker.slaveCircuit((params) => retry(() => this._s3.getObjectAsync(params), this._options.retry))
    this._s3.deleteObjectCircuitBreaker = this._breaker.slaveCircuit((params) => retry(() => this._s3.deleteObjectAsync(params), this._options.retry))
    this._s3.listObjectsCircuitBreaker = this._breaker.slaveCircuit((params) => retry(() => this._s3.listObjectsAsync(params), this._options.retry))

    Health.addCheck('s3', () => new Promise((resolve, reject) => {
      if (this._breaker.isOpen()) {
        return reject(new Error(`circuit breaker is open`))
      } else {
        return resolve()
      }
    }))
  }

  putObject (key, data) {
    if (!key || !data) {
      return Promise.reject(new Error('invalid arguments'))
    }

    const params = { Bucket: this._options.bucket, Key: key, Body: data }

    return this._s3.putObjectCircuitBreaker.exec(params)
  }

  copyObject (srcKey, dstKey) {
    if (!srcKey || !dstKey) {
      return Promise.reject(new Error('invalid arguments'))
    }

    const params = { Bucket: this._options.bucket, CopySource: srcKey, Key: dstKey }

    return this._s3.copyObjectCircuitBreaker.exec(params)
  }

  getObject (key) {
    if (!key) {
      return Promise.reject(new Error('invalid arguments'))
    }

    const params = { Bucket: this._options.bucket, Key: key }

    return this._s3.getObjectCircuitBreaker.exec(params)
  }

  deleteObject (key) {
    if (!key) {
      return Promise.reject(new Error('invalid arguments'))
    }

    const params = { Bucket: this._options.bucket, Key: key }

    return this._s3.deleteObjectCircuitBreaker.exec(params)
  }

  listObjects (prefix, maxKeys = 1000) {
    if (!prefix) {
      return Promise.reject(new Error('invalid arguments'))
    }

    const params = { Bucket: this._options.bucket, Prefix: prefix, MaxKeys: maxKeys }

    return this._s3.listObjectsCircuitBreaker.exec(params)
      .then((data) => _.map(data.Contents, ({ Key }) => Key))
  }
}

module.exports = S3
