/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the 
 * LICENSE.md file in the root directory of this source tree.
 */

import { Injectable } from '@angular/core'

import { Observable } from 'rxjs/Observable'

import * as _ from 'lodash'
import { HttpWrapper } from '../utils'

@Injectable()
export class RecommendationsService {
  constructor (private http: HttpWrapper) {
  }

  getAll (page: number = 0, limit: number = 25, criteria?: any, select?: any, sort?: string): Observable<any> {
    const _criteria = criteria ? `&criteria=${JSON.stringify(criteria)}` : ''
    const _select = _.reduce(select, (a, s) => `${a}&select=${s}`, '')
    const _sort = sort ? `&sort=${sort}` : ''

    return this.http.get(`recommendations?page=${page}&limit=${limit}${_criteria}${_select}${_sort}`)
  }

  getById (id: string): Observable<any> {
    return this.http.get(`recommendations/${id}`)
  }

  like (id: string): Observable<any> {
    return this.http.post(`recommendations/${id}/like`, {})
  }

  pass (id: string): Observable<any> {
    return this.http.post(`recommendations/${id}/pass`, {})
  }

  checkOut (id: string): Observable<any> {
    return this.http.post(`recommendations/${id}/checkout`, {})
  }
}
