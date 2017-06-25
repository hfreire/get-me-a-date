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

const encodeExternalImageId = (externalImageId) => {
  const encodedExternalImageId = Buffer.from(externalImageId).toString('base64')

  return encodedExternalImageId.indexOf('=') > 0 ? encodedExternalImageId.replace(/=/g, '') : encodedExternalImageId
}

const decodeExternalImageId = (externalImageId) => {
  return externalImageId.length % 4 ? decodeExternalImageId(`${externalImageId}=`) : Buffer.from(externalImageId, 'base64').toString('ascii')
}

const defaultOptions = {
  retry: { max_tries: 3, interval: 1000, timeout: 12000, throw_original: true },
  breaker: {
    timeout: 16000,
    threshold: 80,
    circuitDuration: 30000,
    isFailure: (error) => {
      const codes = [ 'InvalidImageFormatException', 'ValidationException', 'InvalidParameterException' ]

      return !_.some(codes, (message) => _.includes(error.code, message))
    }
  }
}

class Rekognition {
  constructor (options = {}) {
    this._options = _.defaults(options, defaultOptions)

    const { region, accessKeyId, secretAccessKey } = this._options
    AWS.config.update({ region, accessKeyId, secretAccessKey })

    this._rekognition = Promise.promisifyAll(new AWS.Rekognition())

    this._breaker = new Brakes(this._options.breaker)

    this._rekognition.listCollectionsCircuitBreaker = this._breaker.slaveCircuit((params) => retry(() => this._rekognition.listCollectionsAsync(params), this._options.retry))
    this._rekognition.createCollectionCircuitBreaker = this._breaker.slaveCircuit((params) => retry(() => this._rekognition.createCollectionAsync(params), this._options.retry))
    this._rekognition.indexFacesCircuitBreaker = this._breaker.slaveCircuit((params) => retry(() => this._rekognition.indexFacesAsync(params), this._options.retry))
    this._rekognition.listFacesCircuitBreaker = this._breaker.slaveCircuit((params) => retry(() => this._rekognition.listFacesAsync(params), this._options.retry))
    this._rekognition.deleteFacesCircuitBreaker = this._breaker.slaveCircuit((params) => retry(() => this._rekognition.deleteFacesAsync(params), this._options.retry))
    this._rekognition.detectFacesCircuitBreaker = this._breaker.slaveCircuit((params) => retry(() => this._rekognition.detectFacesAsync(params), this._options.retry))
    this._rekognition.detectLabelsCircuitBreaker = this._breaker.slaveCircuit((params) => retry(() => this._rekognition.detectLabelsAsync(params), this._options.retry))
    this._rekognition.searchFacesByImageCircuitBreaker = this._breaker.slaveCircuit((params) => retry(() => this._rekognition.searchFacesByImageAsync(params), this._options.retry))

    Health.addCheck('rekognition', () => new Promise((resolve, reject) => {
      if (this._breaker.isOpen()) {
        return reject(new Error(`circuit breaker is open`))
      } else {
        return resolve()
      }
    }))
  }

  listCollections () {
    const params = {}

    return this._rekognition.listCollectionsCircuitBreaker.exec(params)
      .then((data) => data.CollectionIds)
  }

  createCollection (collectionId) {
    if (!collectionId) {
      return Promise.reject(new Error('invalid arguments'))
    }

    const params = { CollectionId: collectionId }

    return this._rekognition.createCollectionCircuitBreaker.exec(params)
  }

  indexFaces (collectionId, bucket, key) {
    if (!collectionId || !key) {
      return Promise.reject(new Error('invalid arguments'))
    }

    const params = {
      CollectionId: collectionId,
      ExternalImageId: encodeExternalImageId(key),
      Image: {
        S3Object: {
          Bucket: bucket,
          Name: key
        }
      }
    }

    return this._rekognition.indexFacesCircuitBreaker.exec(params)
  }

  listFaces (collectionId) {
    if (!collectionId) {
      return Promise.reject(new Error('invalid arguments'))
    }

    const params = { CollectionId: collectionId }

    return this._rekognition.listFacesCircuitBreaker.exec(params)
      .then((data) => {
        return Promise.mapSeries(data.Faces, (face) => {
          face.ExternalImageId = decodeExternalImageId(face.ExternalImageId)
        })
          .then(() => data)
      })
  }

  deleteFaces (collectionId, faceIds) {
    if (!collectionId || !faceIds) {
      return Promise.reject(new Error('invalid arguments'))
    }

    if (_.isEmpty(faceIds)) {
      return Promise.resolve()
    }

    const params = {
      CollectionId: collectionId,
      FaceIds: faceIds
    }

    return this._rekognition.deleteFacesCircuitBreaker.exec(params)
  }

  detectFaces (image) {
    if (!image) {
      return Promise.reject(new Error('invalid arguments'))
    }

    const params = { Image: { Bytes: image } }

    return this._rekognition.detectFacesCircuitBreaker.exec(params)
  }

  detectLabels (image) {
    if (!image) {
      return Promise.reject(new Error('invalid arguments'))
    }

    const params = { Image: { Bytes: image } }

    return this._rekognition.detectLabelsCircuitBreaker.exec(params)
  }

  searchFacesByImage (collectionId, image) {
    if (!collectionId || !image) {
      return Promise.reject(new Error('invalid arguments'))
    }

    const params = {
      CollectionId: collectionId,
      FaceMatchThreshold: 10,
      MaxFaces: 5,
      Image: { Bytes: image }
    }

    return this._rekognition.searchFacesByImageCircuitBreaker.exec(params)
  }
}

module.exports = Rekognition
