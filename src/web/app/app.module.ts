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
  MdMenuModule,
  MdPaginatorModule,
  MdProgressSpinnerModule,
  MdSelectModule,
  MdSidenavModule,
  MdSliderModule,
  MdSlideToggleModule,
  MdToolbarModule,
  MdTooltipModule
} from '@angular/material'

import { MomentModule } from 'angular2-moment'
import { ChartsModule } from 'ng2-charts'

import { AppComponent } from './app.component'
import { RecommendationDialogComponent, RecommendationsComponent } from './recommendations'
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
    MdTooltipModule,
    MdButtonModule,
    MdGridListModule,
    MdToolbarModule,
    MdProgressSpinnerModule,
    MdSidenavModule,
    MdCardModule,
    MomentModule,
    MdIconModule,
    MdSlideToggleModule,
    MdSelectModule,
    MdMenuModule,
    MdCheckboxModule,
    MdInputModule,
    MdSliderModule,
    MdPaginatorModule,
    ChartsModule
  ],
  declarations: [ AppComponent, CapitalizePipe, RecommendationsComponent, RecommendationDialogComponent, ChannelsComponent, SettingsComponent, StatsComponent ],
  entryComponents: [ RecommendationDialogComponent, RecommendationsComponent, ChannelsComponent, SettingsComponent, StatsComponent ],
  bootstrap: [ AppComponent ]
})
export class AppModule {
}
