/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable promise/no-callback-in-promise */

describe('S3', () => {
  let subject
  let AWS

  before(() => {
    AWS = td.object([ 'config' ])
    AWS.config.update = td.function()
    AWS.S3 = td.constructor([ 'listBuckets', 'createBucket', 'putBucketPolicy', 'putObject', 'copyObject', 'getObject', 'deleteObject', 'listObjects' ])
  })

  afterEach(() => td.reset())

  describe('when constructing', () => {
    const region = 'my-region'
    const accessKeyId = 'my-access-key-id'
    const secretAccessKey = 'my-secret-access-key'
    const options = { region, accessKeyId, secretAccessKey }

    beforeEach(() => {
      td.replace('aws-sdk', AWS)

      const S3 = require('../../src/utils/s3')
      subject = new S3(options)
    })

    it('should configure AWS access', () => {
      const captor = td.matchers.captor()

      td.verify(AWS.config.update(captor.capture()), { times: 1 })

      const params = captor.value
      params.region.should.be.equal(region)
      params.accessKeyId.should.be.equal(accessKeyId)
      params.secretAccessKey.should.be.equal(secretAccessKey)
    })
  })

  describe('when listing buckets', () => {
    const options = {}

    beforeEach(() => {
      td.when(AWS.S3.prototype.listBuckets(td.matchers.anything()), { ignoreExtraArgs: true }).thenCallback({})
      td.replace('aws-sdk', AWS)

      const S3 = require('../../src/utils/s3')
      subject = new S3(options)
      subject.listBuckets()
    })

    it('should call AWS S3 listBuckets', () => {
      td.verify(AWS.S3.prototype.listBuckets({}), { ignoreExtraArgs: true, times: 1 })
    })
  })

  describe('when creating a bucket', () => {
    const bucket = 'my-bucket'
    const policy = JSON.stringify({
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
    })
    const options = { bucket }

    beforeEach(() => {
      td.when(AWS.S3.prototype.createBucket(td.matchers.anything()), { ignoreExtraArgs: true }).thenCallback()
      td.when(AWS.S3.prototype.putBucketPolicy(td.matchers.anything()), { ignoreExtraArgs: true }).thenCallback()
      td.replace('aws-sdk', AWS)

      const S3 = require('../../src/utils/s3')
      subject = new S3(options)
    })

    it('should call AWS S3 createBucket', () => {
      return subject.createBucket(bucket)
        .then(() => {
          td.verify(AWS.S3.prototype.createBucket({ Bucket: bucket }), { ignoreExtraArgs: true, times: 1 })
        })
    })

    it('should call AWS S3 putBucketPolicy', () => {
      return subject.createBucket(bucket)
        .then(() => {
          td.verify(AWS.S3.prototype.putBucketPolicy({ Bucket: bucket, Policy: policy }), {
            ignoreExtraArgs: true,
            times: 1
          })
        })
    })
  })

  describe('when creating a bucket with invalid arguments', () => {
    const bucket = 'my-bucket'
    const bucketName = undefined
    const options = { bucket }

    beforeEach(() => {
      td.when(AWS.S3.prototype.createBucket(td.matchers.anything()), { ignoreExtraArgs: true }).thenCallback()
      td.replace('aws-sdk', AWS)

      const S3 = require('../../src/utils/s3')
      subject = new S3(options)
    })

    it('should reject with invalid arguments error', (done) => {
      subject.createBucket(bucketName)
        .catch((error) => {
          error.should.be.instanceOf(Error)
          error.message.should.be.equal('invalid arguments')

          done()
        })
    })
  })

  describe('when putting an object', () => {
    const bucket = 'my-bucket'
    const key = 'my-key'
    const data = 'my-data'

    beforeEach(() => {
      td.when(AWS.S3.prototype.putObject(td.matchers.anything()), { ignoreExtraArgs: true }).thenCallback()
      td.replace('aws-sdk', AWS)

      const S3 = require('../../src/utils/s3')
      subject = new S3()
      subject.putObject(bucket, key, data)
    })

    it('should call AWS S3 putObject', () => {
      td.verify(AWS.S3.prototype.putObject({
        Bucket: bucket,
        Key: key,
        Body: data
      }), { ignoreExtraArgs: true, times: 1 })
    })
  })

  describe('when putting an object with invalid arguments', () => {
    const bucket = 'my-bucket'
    const key = undefined
    const data = undefined

    beforeEach(() => {
      td.when(AWS.S3.prototype.putObject(td.matchers.anything()), { ignoreExtraArgs: true }).thenCallback()
      td.replace('aws-sdk', AWS)

      const S3 = require('../../src/utils/s3')
      subject = new S3()
    })

    it('should reject with invalid arguments error', (done) => {
      subject.putObject(bucket, key, data)
        .catch((error) => {
          error.should.be.instanceOf(Error)
          error.message.should.be.equal('invalid arguments')

          done()
        })
    })
  })

  describe('when copying an object', () => {
    const bucket = 'my-bucket'
    const srcKey = 'my-source-key'
    const dstKey = 'my-destination-key'

    beforeEach(() => {
      td.when(AWS.S3.prototype.copyObject(td.matchers.anything()), { ignoreExtraArgs: true }).thenCallback()
      td.replace('aws-sdk', AWS)

      const S3 = require('../../src/utils/s3')
      subject = new S3()
      subject.copyObject(bucket, srcKey, dstKey)
    })

    it('should call AWS S3 copyObject', () => {
      td.verify(AWS.S3.prototype.copyObject({
        Bucket: bucket,
        CopySource: srcKey,
        Key: dstKey
      }), { ignoreExtraArgs: true, times: 1 })
    })
  })

  describe('when copying an object with invalid arguments', () => {
    const bucket = 'my-bucket'
    const srcKey = undefined
    const dstKey = undefined

    beforeEach(() => {
      td.when(AWS.S3.prototype.copyObject(td.matchers.anything()), { ignoreExtraArgs: true }).thenCallback()
      td.replace('aws-sdk', AWS)

      const S3 = require('../../src/utils/s3')
      subject = new S3()
    })

    it('should reject with invalid arguments error', (done) => {
      subject.copyObject(bucket, srcKey, dstKey)
        .catch((error) => {
          error.should.be.instanceOf(Error)
          error.message.should.be.equal('invalid arguments')

          done()
        })
    })
  })

  describe('when getting an object', () => {
    const bucket = 'my-bucket'
    const key = 'my-key'

    beforeEach(() => {
      td.when(AWS.S3.prototype.getObject(td.matchers.anything()), { ignoreExtraArgs: true }).thenCallback()
      td.replace('aws-sdk', AWS)

      const S3 = require('../../src/utils/s3')
      subject = new S3()
      subject.getObject(bucket, key)
    })

    it('should call AWS S3 getObject', () => {
      td.verify(AWS.S3.prototype.getObject({ Bucket: bucket, Key: key }), {
        ignoreExtraArgs: true,
        times: 1
      })
    })
  })

  describe('when getting an object with invalid arguments', () => {
    const bucket = 'my-bucket'
    const key = undefined

    beforeEach(() => {
      td.when(AWS.S3.prototype.getObject(td.matchers.anything()), { ignoreExtraArgs: true }).thenCallback()
      td.replace('aws-sdk', AWS)

      const S3 = require('../../src/utils/s3')
      subject = new S3()
    })

    it('should reject with invalid arguments error', (done) => {
      subject.getObject(bucket, key)
        .catch((error) => {
          error.should.be.instanceOf(Error)
          error.message.should.be.equal('invalid arguments')

          done()
        })
    })
  })

  describe('when deleting an object', () => {
    const bucket = 'my-bucket'
    const key = 'my-key'

    beforeEach(() => {
      td.when(AWS.S3.prototype.deleteObject(td.matchers.anything()), { ignoreExtraArgs: true }).thenCallback()
      td.replace('aws-sdk', AWS)

      const S3 = require('../../src/utils/s3')
      subject = new S3()
      subject.deleteObject(bucket, key)
    })

    it('should call AWS S3 deleteObject', () => {
      td.verify(AWS.S3.prototype.deleteObject({ Bucket: bucket, Key: key }), {
        ignoreExtraArgs: true,
        times: 1
      })
    })
  })

  describe('when deleting an object with invalid arguments', () => {
    const bucket = 'my-bucket'
    const key = undefined

    beforeEach(() => {
      td.when(AWS.S3.prototype.deleteObject(td.matchers.anything()), { ignoreExtraArgs: true }).thenCallback()
      td.replace('aws-sdk', AWS)

      const S3 = require('../../src/utils/s3')
      subject = new S3()
    })

    it('should reject with invalid arguments error', (done) => {
      subject.deleteObject(bucket, key)
        .catch((error) => {
          error.should.be.instanceOf(Error)
          error.message.should.be.equal('invalid arguments')

          done()
        })
    })
  })

  describe('when listing objects', () => {
    const bucket = 'my-bucket'
    const prefix = 'my-prefix'

    beforeEach(() => {
      td.when(AWS.S3.prototype.listObjects(td.matchers.anything()), { ignoreExtraArgs: true }).thenCallback({})
      td.replace('aws-sdk', AWS)

      const S3 = require('../../src/utils/s3')
      subject = new S3()
      subject.listObjects(bucket, prefix)
    })

    it('should call AWS S3 listObjectsAsync', () => {
      td.verify(AWS.S3.prototype.listObjects({
        Bucket: bucket,
        Prefix: prefix,
        MaxKeys: 1000
      }), { ignoreExtraArgs: true, times: 1 })
    })
  })

  describe('when listing objects with invalid arguments', () => {
    const bucket = 'my-bucket'
    const prefix = undefined

    beforeEach(() => {
      td.when(AWS.S3.prototype.listObjects(td.matchers.anything()), { ignoreExtraArgs: true }).thenCallback()
      td.replace('aws-sdk', AWS)

      const S3 = require('../../src/utils/s3')
      subject = new S3()
    })

    it('should reject with invalid arguments error', (done) => {
      subject.listObjects(bucket, prefix)
        .catch((error) => {
          error.should.be.instanceOf(Error)
          error.message.should.be.equal('invalid arguments')

          done()
        })
    })
  })
})
