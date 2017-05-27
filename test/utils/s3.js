/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

describe('S3', () => {
  let subject
  let AWS

  before(() => {
    AWS = td.object([ 'config' ])
    AWS.config.update = td.function()
    AWS.S3 = td.constructor([ 'putObject', 'copyObject', 'getObject', 'deleteObject', 'listObjects' ])
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

  describe('when putting an object', () => {
    const bucket = 'my-bucket'
    const key = 'my-key'
    const data = 'my-data'
    const options = { bucket }

    beforeEach(() => {
      td.replace('aws-sdk', AWS)

      const S3 = require('../../src/utils/s3')
      subject = new S3(options)

      td.when(AWS.S3.prototype.putObject(), { ignoreExtraArgs: true }).thenCallback()

      subject.putObject(key, data)
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
    const options = { bucket }

    beforeEach(() => {
      td.replace('aws-sdk', AWS)

      const S3 = require('../../src/utils/s3')
      subject = new S3(options)

      td.when(AWS.S3.prototype.putObject(), { ignoreExtraArgs: true }).thenCallback()
    })

    it('should reject with invalid arguments error', () => {
      return subject.putObject(key, data)
        .catch((error) => {
          error.should.be.instanceOf(Error)
          error.message.should.be.equal('invalid arguments')
        })
    })
  })

  describe('when copying an object', () => {
    const bucket = 'my-bucket'
    const srcKey = 'my-source-key'
    const dstKey = 'my-destination-key'
    const options = { bucket }

    beforeEach(() => {
      td.replace('aws-sdk', AWS)

      const S3 = require('../../src/utils/s3')
      subject = new S3(options)

      td.when(AWS.S3.prototype.copyObject(), { ignoreExtraArgs: true }).thenCallback()

      subject.copyObject(srcKey, dstKey)
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
    const options = { bucket }

    beforeEach(() => {
      td.replace('aws-sdk', AWS)

      const S3 = require('../../src/utils/s3')
      subject = new S3(options)

      td.when(AWS.S3.prototype.copyObject(), { ignoreExtraArgs: true }).thenCallback()
    })

    it('should reject with invalid arguments error', () => {
      return subject.copyObject(srcKey, dstKey)
        .catch((error) => {
          error.should.be.instanceOf(Error)
          error.message.should.be.equal('invalid arguments')
        })
    })
  })

  describe('when getting an object', () => {
    const bucket = 'my-bucket'
    const key = 'my-key'
    const options = { bucket }

    beforeEach(() => {
      td.replace('aws-sdk', AWS)

      const S3 = require('../../src/utils/s3')
      subject = new S3(options)

      subject.getObject(key)
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
    const options = { bucket }

    beforeEach(() => {
      td.replace('aws-sdk', AWS)

      const S3 = require('../../src/utils/s3')
      subject = new S3(options)

      td.when(AWS.S3.prototype.getObject(), { ignoreExtraArgs: true }).thenCallback()
    })

    it('should reject with invalid arguments error', () => {
      return subject.getObject(key)
        .catch((error) => {
          error.should.be.instanceOf(Error)
          error.message.should.be.equal('invalid arguments')
        })
    })
  })

  describe('when deleting an object', () => {
    const bucket = 'my-bucket'
    const key = 'my-key'
    const options = { bucket }

    beforeEach(() => {
      td.replace('aws-sdk', AWS)

      const S3 = require('../../src/utils/s3')
      subject = new S3(options)

      subject.deleteObject(key)
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
    const options = { bucket }

    beforeEach(() => {
      td.replace('aws-sdk', AWS)

      const S3 = require('../../src/utils/s3')
      subject = new S3(options)

      td.when(AWS.S3.prototype.deleteObject(), { ignoreExtraArgs: true }).thenCallback()
    })

    it('should reject with invalid arguments error', () => {
      return subject.deleteObject(key)
        .catch((error) => {
          error.should.be.instanceOf(Error)
          error.message.should.be.equal('invalid arguments')
        })
    })
  })

  describe('when listing objects', () => {
    const bucket = 'my-bucket'
    const prefix = 'my-prefix'
    const options = { bucket }

    beforeEach(() => {
      td.replace('aws-sdk', AWS)

      const S3 = require('../../src/utils/s3')
      subject = new S3(options)

      subject.listObjects(prefix)
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
    const options = { bucket }

    beforeEach(() => {
      td.replace('aws-sdk', AWS)

      const S3 = require('../../src/utils/s3')
      subject = new S3(options)

      td.when(AWS.S3.prototype.listObjects(), { ignoreExtraArgs: true }).thenCallback()
    })

    it('should reject with invalid arguments error', () => {
      return subject.listObjects(prefix)
        .catch((error) => {
          error.should.be.instanceOf(Error)
          error.message.should.be.equal('invalid arguments')
        })
    })
  })
})
