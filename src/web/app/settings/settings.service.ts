/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the 
 * LICENSE.md file in the root directory of this source tree.
 */

import { Injectable } from '@angular/core'

import { Observable } from 'rxjs/Observable'

import { HttpWrapper } from '../utils'

@Injectable()
export class SettingsService {
  constructor (private http: HttpWrapper) {
  }

  get (): Observable<any> {
    return this.http.get('settings')
  }

  update (settings: any): Observable<any> {
    return this.http.put('settings', JSON.stringify(settings))
  }

  delete (): Observable<any> {
    return this.http.delete('settings')
  }
}
