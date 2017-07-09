/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Component, EventEmitter, Input, Output } from '@angular/core'

import { animate, state, style, transition, trigger } from '@angular/animations'

@Component({
  selector: 'recommendation-tile',
  templateUrl: '/app/recommendations/recommendations-list/recommendation-tile/recommendation-tile.html',
  animations: [
    trigger('fadeInOut', [
      state('in', style({ opacity: 1, visibility: 'visible' })),
      state('out', style({ opacity: 0, visibility: 'hidden' })),
      transition('in <=> out', [
        animate('1s ease-out')
      ])
    ])
  ]
})
export class RecommendationTileComponent {
  @Input()
  recommendation: any

  @Output()
  click: EventEmitter<any> = new EventEmitter<any>()

  fadeInState = 'in'
  fadeOutState = 'out'

  public isLoaded (event: Event) {
    this.fadeInState = 'out'
    this.fadeOutState = 'in'
  }

  onClick (id: string) {
    this.click.emit(id)
  }
}
