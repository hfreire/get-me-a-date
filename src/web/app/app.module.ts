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
  MdDialogModule,
  MdGridListModule,
  MdIconModule,
  MdMenuModule,
  MdProgressSpinnerModule,
  MdSelectModule,
  MdSidenavModule,
  MdSlideToggleModule,
  MdToolbarModule,
  MdTooltipModule
} from '@angular/material'

import { MomentModule } from 'angular2-moment'
import { NgxPaginationModule } from 'ngx-pagination'
import { ChartsModule } from 'ng2-charts'

import { AppComponent } from './app.component'
import { RecommendationDialogComponent, RecommendationsComponent } from './recommendations'
import { ChannelsComponent } from './channels'
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
    NgxPaginationModule,
    MdSelectModule,
    MdMenuModule,
    ChartsModule
  ],
  declarations: [ AppComponent, CapitalizePipe, RecommendationsComponent, RecommendationDialogComponent, ChannelsComponent, StatsComponent ],
  entryComponents: [ RecommendationDialogComponent, RecommendationsComponent, ChannelsComponent, StatsComponent ],
  bootstrap: [ AppComponent ]
})
export class AppModule {
}
