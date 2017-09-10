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
  retry: { max_tries: 3, interval: 1000, timeout: 38000, throw_original: true },
  breaker: { timeout: 140000, threshold: 80, circuitDuration: 30000 }
}

class S3 {
  constructor (options = {}) {
    this._options = _.defaults(options, defaultOptions)

    const { region, accessKeyId, secretAccessKey } = this._options
    AWS.config.update({ region, accessKeyId, secretAccessKey })

    this._s3 = Promise.promisifyAll(new AWS.S3())

    this._circuitBreaker = new Brakes(this._options.breaker)

    this._s3.listBucketsCircuitBreaker = this._circuitBreaker.slaveCircuit((params) => retry(() => this._s3.listBucketsAsync(params), this._options.retry))
    this._s3.createBucketCircuitBreaker = this._circuitBreaker.slaveCircuit((params) => retry(() => this._s3.createBucketAsync(params), this._options.retry))
    this._s3.putBucketPolicyCircuitBreaker = this._circuitBreaker.slaveCircuit((params) => retry(() => this._s3.putBucketPolicyAsync(params), this._options.retry))
    this._s3.putObjectCircuitBreaker = this._circuitBreaker.slaveCircuit((params) => retry(() => this._s3.putObjectAsync(params), this._options.retry))
    this._s3.copyObjectCircuitBreaker = this._circuitBreaker.slaveCircuit((params) => retry(() => this._s3.copyObjectAsync(params), this._options.retry))
    this._s3.getObjectCircuitBreaker = this._circuitBreaker.slaveCircuit((params) => retry(() => this._s3.getObjectAsync(params), this._options.retry))
    this._s3.deleteObjectCircuitBreaker = this._circuitBreaker.slaveCircuit((params) => retry(() => this._s3.deleteObjectAsync(params), this._options.retry))
    this._s3.listObjectsCircuitBreaker = this._circuitBreaker.slaveCircuit((params) => retry(() => this._s3.listObjectsAsync(params), this._options.retry))

    Health.addCheck('s3', () => new Promise((resolve, reject) => {
      if (this._circuitBreaker.isOpen()) {
        return reject(new Error(`circuit breaker is open`))
      } else {
        return resolve()
      }
    }))
  }

  listBuckets () {
    const params = {}

    return this._s3.listBucketsCircuitBreaker.exec(params)
      .then(({ Buckets }) => _.map(Buckets, 'Name'))
  }

  createBucket (bucket) {
    if (!bucket) {
      return Promise.reject(new Error('invalid arguments'))
    }

    const params = {
      Bucket: bucket
    }

    return this._s3.createBucketCircuitBreaker.exec(params)
      .then(() => {
        const policy = {
          Version: '2008-10-17',
          Statement: [
            {
              Sid: 'AllowPublicRead',
              Effect: 'Allow',
              Principal: {
                AWS: '*'
              },
              Action: 's3:GetObject',
              Resource: `arn:aws:s3:::${bucket}/*`
            }
          ]
        }

        const params = {
          Bucket: bucket,
          Policy: JSON.stringify(policy)
        }

        return this._s3.putBucketPolicyCircuitBreaker.exec(params)
      })
  }

  putObject (bucket, key, data) {
    if (!bucket || !key || !data) {
      return Promise.reject(new Error('invalid arguments'))
    }

    const params = { Bucket: bucket, Key: key, Body: data }

    return this._s3.putObjectCircuitBreaker.exec(params)
  }

  copyObject (bucket, srcKey, dstKey) {
    if (!bucket || !srcKey || !dstKey) {
      return Promise.reject(new Error('invalid arguments'))
    }

    const params = { Bucket: bucket, CopySource: srcKey, Key: dstKey }

    return this._s3.copyObjectCircuitBreaker.exec(params)
  }

  getObject (bucket, key) {
    if (!bucket || !key) {
      return Promise.reject(new Error('invalid arguments'))
    }

    const params = { Bucket: bucket, Key: key }

    return this._s3.getObjectCircuitBreaker.exec(params)
  }

  deleteObject (bucket, key) {
    if (!bucket || !key) {
      return Promise.reject(new Error('invalid arguments'))
    }

    const params = { Bucket: bucket, Key: key }

    return this._s3.deleteObjectCircuitBreaker.exec(params)
  }

  listObjects (bucket, prefix, maxKeys = 1000) {
    if (!bucket || !prefix) {
      return Promise.reject(new Error('invalid arguments'))
    }

    const params = { Bucket: bucket, Prefix: prefix, MaxKeys: maxKeys }

    let objects = []
    const _listObjects = (params) => {
      return this._s3.listObjectsCircuitBreaker.exec(params)
        .then((data) => {
          objects = objects.concat(_.map(data.Contents, 'Key'))

          if (data.IsTruncated) {
            if (data.NextMarker) {
              params.Marker = data.NextMarker
            } else {
              params.Marker = data.Contents[ data.Contents.length - 1 ].Key
            }

            return _listObjects(params)
          }
        })
    }

    return _listObjects(params)
      .then(() => objects)
  }
}

module.exports = S3
