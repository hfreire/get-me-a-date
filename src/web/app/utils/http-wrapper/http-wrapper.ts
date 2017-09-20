/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { HttpClient } from '@angular/common/http'

import { Injectable } from '@angular/core'

import { Observable } from 'rxjs/Observable'
import 'rxjs/add/operator/retryWhen'
import 'rxjs/add/operator/timeout'
import 'rxjs/add/operator/map'
import 'rxjs/add/operator/delay'

const defaultOptions = {
  retry: { timeout: 8000, delay: 1000 }
}

@Injectable()
export class HttpWrapper {
  private options: any

  constructor (private http: HttpClient) {
    this.options = defaultOptions
  }

  get (path: string): Observable<any> {
    return this.http.get(path)
      .retryWhen((errors: Observable<any>) => errors.delay(this.options.retry.delay))
      .timeout(this.options.retry.timeout)
  }

  post (path: string, body: any): Observable<any> {
    return this.http.post(path, body)
      .retryWhen((errors: Observable<any>) => errors.delay(this.options.retry.delay))
      .timeout(this.options.retry.timeout)
  }

  put (path: string, body: any): Observable<any> {
    return this.http.put(path, body)
      .retryWhen((errors: Observable<any>) => errors.delay(this.options.retry.delay))
      .timeout(this.options.retry.timeout)
  }

  delete (path: string): Observable<any> {
    return this.http.delete(path)
      .retryWhen((errors: Observable<any>) => errors.delay(this.options.retry.delay))
      .timeout(this.options.retry.timeout)
  }
}
