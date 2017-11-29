/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE.md file in the root directory of this source tree.
 */

import { NgModule } from '@angular/core'
import { MdCardModule } from '@angular/material'

import { ChartsModule } from 'ng2-charts'
import { StatsComponent } from './stats.component'
import { StatsService } from './stats.service'

@NgModule({
  imports: [
    MdCardModule,
    ChartsModule
  ],
  declarations: [
    StatsComponent
  ],
  exports: [ StatsComponent ],
  providers: [ StatsService ]
})
export class StatsModule {
}
