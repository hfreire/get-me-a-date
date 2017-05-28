/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {PeopleService} from "./people.service";

import {Component, Inject} from "@angular/core";
import {MD_DIALOG_DATA, MdDialogRef} from "@angular/material";

import * as _ from "lodash";

@Component({
  selector: 'person-dialog',
  templateUrl: '/app/people/person-dialog.html',
  providers: [ PeopleService ]
})
export class PersonDialogComponent {
  occupation: any;
  private today: Date;
  private person: any;

  constructor (public dialogRef: MdDialogRef<any>, @Inject(MD_DIALOG_DATA) public data: any, private peopleService: PeopleService) { }

  ngOnInit () {
    this.today = new Date()
    this.person = this.data.person;
    this.occupation = _.has(this.person, 'data.schools[0].name') ? this.person.data.schools[ 0 ].name : _.has(this.person, 'data.jobs[0].company.name') ? this.person.data.jobs[ 0 ].company.name : ''
  }

  trainPerson () {
    this.peopleService.train(this.person.id)
      .subscribe(() => {})
  }
}

