/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Injectable } from '@angular/core'
import { Http } from '@angular/http'
import { Observable } from 'rxjs/Observable'

@Injectable()
export class StatsService {
  constructor (private http: Http) {}

  getAll (page: number = 1, limit: number = 25): Observable<any> {
    return this.http.get(`/stats?page=${page}&limit=${limit}`)
      .retryWhen((error: any) => error.delay(500))
      .timeout(2000)
      .map((response) => response.json())
  }
}
