/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

const BASE_API_URL = process.env.BASE_API_URL

import { Inject, Injectable } from '@angular/core'
import { DOCUMENT } from '@angular/platform-browser'
import { Http } from '@angular/http'

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
  private baseApiUrl: string

  constructor (private http: Http, @Inject(DOCUMENT) private document: any) {
    this.options = defaultOptions

    this.baseApiUrl = BASE_API_URL ? BASE_API_URL : `${this.document.location.hostname}:5940`
  }

  get (path: string): Observable<any> {
    return this.http.get(`//${this.baseApiUrl}/${path}`)
      .retryWhen((errors: Observable<any>) => errors.delay(this.options.retry.delay))
      .timeout(this.options.retry.timeout)
      .map((res) => res.json())
  }

  post (path: string, body: any): Observable<any> {
    return this.http.post(`//${this.baseApiUrl}/${path}`, body)
      .retryWhen((errors: Observable<any>) => errors.delay(this.options.retry.delay))
      .timeout(this.options.retry.timeout)
      .map((res) => res.json())
  }

  put (path: string, body: any): Observable<any> {
    return this.http.put(`//${this.baseApiUrl}/${path}`, body)
      .retryWhen((errors: Observable<any>) => errors.delay(this.options.retry.delay))
      .timeout(this.options.retry.timeout)
      .map((res) => res.json())
  }

  delete (path: string): Observable<any> {
    return this.http.delete(`//${this.baseApiUrl}/${path}`)
      .retryWhen((errors: Observable<any>) => errors.delay(this.options.retry.delay))
      .timeout(this.options.retry.timeout)
      .map((res) => res.json())
  }
}
