/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { NgModule } from '@angular/core'
import { BrowserModule } from '@angular/platform-browser'
import { HttpModule } from '@angular/http'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'
import 'hammerjs'
import {
  MdButtonModule,
  MdCardModule,
  MdCheckboxModule,
  MdDialogModule,
  MdGridListModule,
  MdIconModule,
  MdInputModule,
  MdProgressSpinnerModule,
  MdSidenavModule,
  MdSliderModule,
  MdSlideToggleModule,
  MdToolbarModule
} from '@angular/material'
import { ChartsModule } from 'ng2-charts'
import { RecommendationsModule } from './recommendations'

import { AppComponent } from './app.component'
import { ChannelsComponent } from './channels'
import { SettingsComponent } from './settings'
import { StatsComponent } from './stats'
import { CapitalizePipe } from './capitalize.pipe'

@NgModule({
  imports: [
    BrowserModule,
    HttpModule,
    NoopAnimationsModule,
    MdDialogModule,
    MdGridListModule,
    MdToolbarModule,
    MdProgressSpinnerModule,
    MdSidenavModule,
    MdCardModule,
    MdSlideToggleModule,
    MdCheckboxModule,
    MdInputModule,
    MdSliderModule,
    MdButtonModule,
    MdIconModule,
    ChartsModule,
    RecommendationsModule
  ],
  declarations: [ AppComponent, CapitalizePipe, ChannelsComponent, SettingsComponent, StatsComponent ],
  entryComponents: [ ChannelsComponent, SettingsComponent, StatsComponent ],
  bootstrap: [ AppComponent ]
})
export class AppModule {
}
