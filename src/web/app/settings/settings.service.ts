/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Injectable } from '@angular/core'
import { Http } from '@angular/http'
import 'rxjs/add/operator/map'

@Injectable()
export class SettingsService {
  constructor (private http: Http) {
  }

  get () {
    return this.http.get('/settings')
      .map((res) => res.json())
  }

  update (settings: any) {
    return this.http.put('/settings', JSON.stringify(settings))
      .map((res) => res.json())
  }

  delete () {
    return this.http.delete(`/settings`)
      .map((res) => res.json())
  }
}
