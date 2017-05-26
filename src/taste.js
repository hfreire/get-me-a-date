/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

const AWS_REGION = process.env.AWS_REGION
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY
const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET
const AWS_REKOGNITION_COLLECTION = process.env.AWS_REKOGNITION_COLLECTION || 'get-me-a-tinder-date'

const _ = require('lodash')
const Promise = require('bluebird')

const Logger = require('modern-logger')

const S3 = require('./utils/s3')
const Rekognition = require('./utils/rekognition')

const request = Promise.promisifyAll(require('request').defaults({ encoding: null }))

class Taste {
  constructor () {
    this.rekognition = new Rekognition({
      region: AWS_REGION,
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY
    })

    this.s3 = new S3({
      region: AWS_REGION,
      bucket: AWS_S3_BUCKET,
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY
    })
  }

  start () {
    return this.createRekognitionCollectionIfNeeded()
      .then(() => this.syncS3BucketAndRekognitionCollection())
  }

  createRekognitionCollectionIfNeeded () {
    return this.rekognition.listCollections()
      .then((collectionIds) => {
        if (!_.includes(collectionIds, AWS_REKOGNITION_COLLECTION)) {
          return this.rekognition.createCollection(AWS_REKOGNITION_COLLECTION)
        }
      })
  }

  syncS3BucketAndRekognitionCollection () {
    return this.rekognition.listFaces(AWS_REKOGNITION_COLLECTION)
      .then(({ Faces }) => {
        const currentFaces = _.map(Faces, 'ExternalImageId')

        return this.s3.listObjects('train')
          .then((availableFaces) => {
            const facesToDelete = _.difference(currentFaces, availableFaces)
            const facesToIndex = _.difference(availableFaces, currentFaces)

            const _facesToDelete = _(facesToDelete)
              .filter((externalImageId) => _.find(Faces, { ExternalImageId: externalImageId }))
              .map((externalImageId) => _.find(Faces, { ExternalImageId: externalImageId }).FaceId)
              .value()

            return Promise.all([
              this.rekognition.deleteFaces(AWS_REKOGNITION_COLLECTION, _facesToDelete)
                .catch((error) => Logger.warn(error)),
              Promise.mapSeries(facesToIndex, (face) => {
                return this.rekognition.indexFaces(AWS_REKOGNITION_COLLECTION, AWS_S3_BUCKET, `train/${face}`)
                  .catch((error) => Logger.warn(error))
              })
            ])
              .then(() => Logger.debug(`Synced reference face collection: ${currentFaces.length - facesToDelete.length + facesToIndex.length} faces available (deleted ${facesToDelete.length}, indexed ${facesToIndex.length})`))
          })
      })
  }

  checkPhotosOut (photos) {
    return Promise.mapSeries(photos, ({ url }) => {
      let faceSimilarity = 0

      return this.rekognition.searchFacesByImage(AWS_REKOGNITION_COLLECTION, url)
        .then(({ FaceMatches }) => {
          return Promise.mapSeries(FaceMatches, ({ Similarity }) => {
            if (!faceSimilarity) {
              faceSimilarity = Similarity

              return
            }

            faceSimilarity = (faceSimilarity + Similarity) / 2
          })
        })
        .then(() => faceSimilarity)
        .catch(() => {
          return undefined
        })
    })
  }

  mentalSnapshot (urls) {
    return Promise.mapSeries(urls, (url) => {
      return request.getAsync(url)
        .then(({ body }) => this.s3.putObject(`train/${url.split('/')[ 4 ]}`, body))
    })
      .then(() => this.syncS3BucketAndRekognitionCollection())
  }
}

module.exports = new Taste()
