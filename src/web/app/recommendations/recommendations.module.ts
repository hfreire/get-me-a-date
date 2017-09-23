/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import {
  MdButtonModule,
  MdCardModule,
  MdChipsModule,
  MdGridListModule,
  MdIconModule,
  MdInputModule,
  MdMenuModule,
  MdPaginatorModule,
  MdProgressBarModule,
  MdProgressSpinnerModule,
  MdSelectModule,
  MdTooltipModule
} from '@angular/material'
import { MomentModule } from 'angular2-moment'

import { RecommendationsComponent } from './recommendations.component'
import { RecommendationsService } from './recommendations.service'
import { RecommendationsCriteriaComponent } from './recommendations-criteria'
import {
  RecommendationDialogComponent,
  RecommendationsListComponent,
  RecommendationTileComponent
} from './recommendations-list'
import { FormsModule } from '@angular/forms'

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    MdInputModule,
    MdButtonModule,
    MdCardModule,
    MdGridListModule,
    MdIconModule,
    MdMenuModule,
    MdPaginatorModule,
    MdSelectModule,
    MdTooltipModule,
    MdChipsModule,
    MdProgressSpinnerModule,
    MdProgressBarModule,
    MomentModule
  ],
  declarations: [
    RecommendationsComponent,
    RecommendationDialogComponent,
    RecommendationsCriteriaComponent,
    RecommendationsListComponent,
    RecommendationTileComponent
  ],
  entryComponents: [
    RecommendationDialogComponent
  ],
  exports: [ RecommendationsComponent ],
  providers: [ RecommendationsService ]
})
export class RecommendationsModule {
}
