/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Component, EventEmitter, Input, Output } from '@angular/core'
import { BehaviorSubject } from 'rxjs/BehaviorSubject'
import 'rxjs/add/operator/takeWhile'
import { animate, state, style, transition, trigger } from '@angular/animations'

@Component({
  selector: 'recommendations-list',
  templateUrl: '/app/recommendations/recommendations-list/recommendations-list.html',
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
export class RecommendationsListComponent {
  @Input()
  set data (value) {
    this._data.next(value)
  }

  get data () {
    return this._data.getValue()
  }

  @Input()
  loaded: boolean = false

  @Output()
  click: EventEmitter<any> = new EventEmitter<any>()

  recommendations: any = []
  fadeInState = 'in'
  fadeOutState = 'out'

  private _data = new BehaviorSubject<any>([])

  public isLoaded (event: Event) {
    this.fadeInState = 'out'
    this.fadeOutState = 'in'
  }

  ngOnInit () {
    this._data
      .subscribe((data) => {
        this.recommendations = data
      })
  }

  onRecommendationClick (id: string, index: number) {
    this.click.emit({ id, index })
  }
}
