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

class Rekognition {
  constructor (options = {}) {
    this._options = _.defaults(options, defaultOptions)

    const { region, accessKeyId, secretAccessKey } = this._options
    AWS.config.update({ region, accessKeyId, secretAccessKey })

    this._rekognition = Promise.promisifyAll(new AWS.Rekognition())
  }

  listCollections () {
    const params = {}

    return this._rekognition.listCollectionsAsync(params)
      .then((data) => data.CollectionIds)
  }

  createCollection (collectionId) {
    if (!collectionId) {
      return Promise.reject(new Error('invalid arguments'))
    }

    const params = { CollectionId: collectionId }

    return this._rekognition.createCollectionAsync(params)
  }

  indexFaces (collectionId, bucket, key) {
    if (!collectionId || !key) {
      return Promise.reject(new Error('invalid arguments'))
    }

    const params = {
      CollectionId: collectionId,
      ExternalImageId: Buffer.from(key).toString('base64'),
      Image: {
        S3Object: {
          Bucket: bucket,
          Name: key
        }
      }
    }

    return this._rekognition.indexFacesAsync(params)
  }

  listFaces (collectionId) {
    if (!collectionId) {
      return Promise.reject(new Error('invalid arguments'))
    }

    const params = { CollectionId: collectionId }

    return this._rekognition.listFacesAsync(params)
      .then((data) => {
        return Promise.mapSeries(data.Faces, (face) => {
          face.ExternalImageId = Buffer.from(face.ExternalImageId, 'base64').toString('ascii')
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

    return this._rekognition.deleteFacesAsync(params)
  }

  detectFaces (image) {
    if (!image) {
      return Promise.reject(new Error('invalid arguments'))
    }

    const params = { Image: { Bytes: image } }

    return this._rekognition.detectFacesAsync(params)
  }

  detectLabels (image) {
    if (!image) {
      return Promise.reject(new Error('invalid arguments'))
    }

    const params = { Image: { Bytes: image } }

    return this._rekognition.detectLabelsAsync(params)
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

    return this._rekognition.searchFacesByImageAsync(params)
  }
}

module.exports = Rekognition
