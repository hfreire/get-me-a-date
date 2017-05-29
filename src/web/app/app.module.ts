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
import { MdButtonModule, MdDialogModule, MdTooltipModule } from '@angular/material'

import { MomentModule } from 'angular2-moment'

import { AppComponent } from './app.component'
import { PersonDialogComponent } from './people/person-dialog.component'

@NgModule({
  imports: [ BrowserModule, HttpModule, NoopAnimationsModule, MdDialogModule, MdTooltipModule, MdButtonModule, MomentModule ],
  declarations: [ AppComponent, PersonDialogComponent ],
  entryComponents: [ PersonDialogComponent ],
  bootstrap: [ AppComponent ]
})
export class AppModule {
}
