/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE.md file in the root directory of this source tree.
 */

import { ApplicationRef, NgModule } from '@angular/core'
import { BrowserModule } from '@angular/platform-browser'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'
import 'hammerjs'
import {
  MdButtonModule,
  MdCardModule,
  MdCheckboxModule,
  MdDialogModule,
  MdGridListModule,
  MdIconModule,
  MdProgressSpinnerModule,
  MdSidenavModule,
  MdSliderModule,
  MdSlideToggleModule,
  MdToolbarModule
} from '@angular/material'
import { createNewHosts, removeNgStyles } from '@angularclass/hmr'

import { HttpWrapperModule } from './utils'

import { AppComponent } from './app.component'
import { RecommendationsModule } from './recommendations'
import { ChannelsComponent } from './channels'
import { SettingsComponent } from './settings'
import { StatsModule } from './stats'

@NgModule({
  imports: [
    BrowserModule,
    NoopAnimationsModule,
    MdDialogModule,
    MdGridListModule,
    MdToolbarModule,
    MdProgressSpinnerModule,
    MdSidenavModule,
    MdCardModule,
    MdSlideToggleModule,
    MdCheckboxModule,
    MdSliderModule,
    MdButtonModule,
    MdIconModule,
    HttpWrapperModule,
    RecommendationsModule,
    StatsModule
  ],
  declarations: [ AppComponent, ChannelsComponent, SettingsComponent ],
  entryComponents: [ ChannelsComponent, SettingsComponent ],
  bootstrap: [ AppComponent ]
})
export class AppModule {
  constructor (public appRef: ApplicationRef) {
  }

  hmrOnDestroy (store: any) {
    const componentLocations = this.appRef.components.map((component) => component.location.nativeElement)

    store.disposeOldHosts = createNewHosts(componentLocations)

    removeNgStyles()
  }

  hmrAfterDestroy (store: any) {
    store.disposeOldHosts()

    delete store.disposeOldHosts
  }
}
