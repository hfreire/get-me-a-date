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

@Injectable()
export class PeopleService {
  constructor (private http: Http) {
  }

  getAll (page: number = 1, limit: number = 25, criteria?: any): Observable<any> {
    const _criteria = criteria ? `&criteria=${JSON.stringify(criteria)}` : ''

    return this.http.get(`/people?page=${page}&limit=${limit}${_criteria}`)
      .retryWhen((error: any) => error.delay(500))
      .timeout(2000)
      .map((response) => response.json())
  }

  streamAll (page: number, limit: number): Observable<any> {
    return Observable
      .interval(5000)
      .startWith(0)
      .switchMap(() => this.getAll(page, limit))
  }

  train (id: string) {
    console.log(id)

    return this.http.post(`/train/${id}`, {})
      .map(() => {
        //
      })
  }
}
