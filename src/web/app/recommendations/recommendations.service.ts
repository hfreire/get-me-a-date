/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Injectable } from '@angular/core'
import { Http } from '@angular/http'
import { Observable } from 'rxjs/Observable'
import 'rxjs/add/operator/retryWhen'
import 'rxjs/add/operator/timeout'
import _ = require('lodash')

@Injectable()
export class RecommendationsService {
  constructor (private http: Http) {
  }

  getAll (page: number = 1, limit: number = 25, criteria?: any, select?: any, sort?: string): Observable<any> {
    const _criteria = criteria ? `&criteria=${JSON.stringify(criteria)}` : ''
    const _select = _.reduce(select, (a, s) => `${a}&select=${s}`, '')
    const _sort = sort = `&sort=${sort}`

    return this.http.get(`/recommendations?page=${page}&limit=${limit}${_criteria}${_select}${_sort}`)
      .retryWhen((error: any) => error.delay(500))
      .timeout(2000)
      .map((response) => response.json())
  }

  getById (id: string) {
    return this.http.get(`/recommendations/${id}`)
      .retryWhen((error: any) => error.delay(500))
      .timeout(2000)
      .map((response) => response.json())
  }

  like (id: string) {
    return this.http.post(`/recommendations/${id}/like`, {})
      .map((response) => response.json())
  }

  pass (id: string) {
    return this.http.post(`/recommendations/${id}/pass`, {})
      .map((response) => response.json())
  }
}
