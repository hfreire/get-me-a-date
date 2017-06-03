/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Pipe, PipeTransform } from '@angular/core'

@Pipe({ name: 'capitalize' })
export class CapitalizePipe implements PipeTransform {
  transform (value: any) {
    if (value) {
      return value.charAt(0).toUpperCase() + value.slice(1)
    }
    return value
  }
}
