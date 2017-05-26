/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

const _ = require('lodash')
const Promise = require('bluebird')

const AWS = require('aws-sdk')

const request = Promise.promisifyAll(require('request').defaults({ encoding: null }))

const defaultOptions = {}

class Rekognition {
  constructor (options = {}) {
    this.options = _.defaults(options, defaultOptions)

    const { region, accessKeyId, secretAccessKey } = this.options
    AWS.config.update({ region, accessKeyId, secretAccessKey })

    this.rekognition = Promise.promisifyAll(new AWS.Rekognition())
  }

  listCollections () {
    const params = {}

    return this.rekognition.listCollectionsAsync(params)
      .then((data) => data.CollectionIds)
  }

  createCollection (collectionId) {
    if (!collectionId) {
      return Promise.reject(new Error('invalid arguments'))
    }

    const params = { CollectionId: collectionId }

    return this.rekognition.createCollectionAsync(params)
  }

  indexFaces (collectionId, bucket, key) {
    if (!collectionId || !key) {
      return Promise.reject(new Error('invalid arguments'))
    }

    const params = {
      CollectionId: collectionId,
      ExternalImageId: key.split('/')[ key.split('/').length - 1 ],
      Image: {
        S3Object: {
          Bucket: bucket,
          Name: key
        }
      }
    }

    return this.rekognition.indexFacesAsync(params)
  }

  listFaces (collectionId) {
    if (!collectionId) {
      return Promise.reject(new Error('invalid arguments'))
    }

    const params = { CollectionId: collectionId }

    return this.rekognition.listFacesAsync(params)
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

    return this.rekognition.deleteFacesAsync(params)
  }

  detectFaces (imageUrl) {
    if (!imageUrl) {
      return Promise.reject(new Error('invalid arguments'))
    }

    return request.getAsync(imageUrl)
      .then(({ body }) => {
        const params = { Image: { Bytes: body } }

        return this.rekognition.detectFacesAsync(params)
      })
  }

  detectLabels (imageUrl) {
    if (!imageUrl) {
      return Promise.reject(new Error('invalid arguments'))
    }

    return request.getAsync(imageUrl)
      .then(({ body }) => {
        const params = { Image: { Bytes: body } }

        return this.rekognition.detectLabelsAsync(params)
      })
  }

  searchFacesByImage (collectionId, imageUrl) {
    if (!collectionId || !imageUrl) {
      return Promise.reject(new Error('invalid arguments'))
    }

    return request.getAsync(imageUrl)
      .then(({ body }) => {
        const params = {
          CollectionId: collectionId,
          FaceMatchThreshold: 10,
          MaxFaces: 5,
          Image: { Bytes: body }
        }

        return this.rekognition.searchFacesByImageAsync(params)
      })
  }
}

module.exports = Rekognition
