/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as _ from 'lodash'

import { Component, EventEmitter, Output } from '@angular/core'

@Component({
  selector: 'recommendations-criteria',
  templateUrl: 'recommendations-criteria.html'
})
export class RecommendationsCriteriaComponent {
  @Output()
  criteria: EventEmitter<string> = new EventEmitter<string>()

  @Output()
  sort: EventEmitter<string> = new EventEmitter<string>()

  availableChannelCriteria: any = [
    { value: { channelName: undefined }, label: 'All' },
    { value: { channelName: 'tinder' }, label: 'Tinder' },
    { value: { channelName: 'happn' }, label: 'Happn' }
  ]
  availableActionCriteria: any = [
    { value: { isLike: undefined, isPass: undefined, isMatch: undefined, isTrain: undefined }, label: 'All' },
    { value: { isLike: true, isPass: undefined, isMatch: undefined, isTrain: undefined }, label: 'Liked' },
    { value: { isLike: undefined, isPass: 1, isMatch: undefined, isTrain: undefined }, label: 'Passed' },
    { value: { isLike: false, isPass: 0, isMatch: undefined, isTrain: undefined }, label: 'Waiting' },
    { value: { isLike: undefined, isPass: undefined, isMatch: 1, isTrain: undefined }, label: 'Matched' },
    { value: { isLike: undefined, isPass: undefined, isMatch: undefined, isTrain: 1 }, label: 'Trained' }
  ]
  _criteria: any = _.assign({}, this.availableChannelCriteria[ 0 ].value, this.availableActionCriteria[ 0 ].value)

  availableSorts: any = [
    { value: 'lastCheckedOutDate', label: 'Last checked out' },
    { value: 'checkedOutTimes', label: 'Number of times checked out' }
  ]
  _sort: any = this.availableSorts[ 0 ].value

  setPageCriterion ({ value }: any) {
    this._criteria = _.assign(this._criteria, value)

    this.criteria.emit(this._criteria)
  }

  setPageSort ({ value }: any) {
    this._sort = value

    this.sort.emit(this._sort)
  }
}
