/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Inject, Injectable } from '@angular/core'
import { Http } from '@angular/http'
import 'rxjs/add/operator/map'
import { DOCUMENT } from '@angular/platform-browser'

@Injectable()
export class SettingsService {
  constructor (private http: Http, @Inject(DOCUMENT) private document: any) {
  }

  get () {
    return this.http.get(`//${this.document.location.hostname}:5940/settings`)
      .map((res) => res.json())
  }

  update (settings: any) {
    return this.http.put(`//${this.document.location.hostname}:5940/settings`, JSON.stringify(settings))
      .map((res) => res.json())
  }

  delete () {
    return this.http.delete(`//${this.document.location.hostname}:5940/settings`)
      .map((res) => res.json())
  }
}
