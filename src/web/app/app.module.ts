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
import {
  MdButtonModule,
  MdCardModule,
  MdDialogModule,
  MdGridListModule,
  MdIconModule,
  MdProgressSpinnerModule,
  MdSidenavModule,
  MdSlideToggleModule,
  MdToolbarModule,
  MdTooltipModule
} from '@angular/material'

import { MomentModule } from 'angular2-moment'
import { NgxPaginationModule } from 'ngx-pagination'

import { AppComponent } from './app.component'
import { PeopleComponent, PersonDialogComponent } from './people'
import { ChannelsComponent } from './channels'
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
    NgxPaginationModule
  ],
  declarations: [ AppComponent, CapitalizePipe, PersonDialogComponent, PeopleComponent, ChannelsComponent ],
  entryComponents: [ PersonDialogComponent, PeopleComponent, ChannelsComponent ],
  bootstrap: [ AppComponent ]
})
export class AppModule {
}
