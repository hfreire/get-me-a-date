/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Injectable } from '@angular/core'

import { Observable } from 'rxjs/Observable'

import { HttpWrapper } from '../utils/http-wrapper/http-wrapper'

@Injectable()
export class StatsService {
  constructor (private http: HttpWrapper) {
  }

  getAll (page: number = 1, limit: number = 25): Observable<any> {
    return this.http.get(`stats?page=${page}&limit=${limit}`)
  }
}
