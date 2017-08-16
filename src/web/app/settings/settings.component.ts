/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Component } from '@angular/core'

import { SettingsService } from './settings.service'

@Component({
  selector: 'settings',
  templateUrl: 'settings.html',
  providers: [ SettingsService ]
})
export class SettingsComponent {
  settings: any = {}

  constructor (private settingsService: SettingsService) {}

  public ngOnInit () {
    this.getSettings()
  }

  getSettings () {
    this.settingsService.get()
      .subscribe((settings) => {
        this.settings = settings
      })
  }

  onChangeOverride (event: any) {
    this.settings.isOverride = event.checked

    if (!this.settings.isOverride) {
      this.settings = {}

      this.settingsService.delete()
        .subscribe((settings) => {
          this.settings = settings
        })
    }
  }

  onChangeLikePhotosThreshold (event: any) {
    this.settings.likePhotosThreshold = event.value

    this.settingsService.update(this.settings)
      .subscribe((settings) => {
        this.settings = settings
      })
  }
}
