/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Component } from '@angular/core'

import { ChannelsService } from './channels.service'

@Component({
  selector: 'channels',
  templateUrl: 'channels.html',
  providers: [ ChannelsService ]
})
export class ChannelsComponent {
  channels: any

  constructor (private channelsService: ChannelsService) {}

  public ngOnInit () {
    this.getAllChannels()
  }

  getAllChannels () {
    this.channelsService.getAll()
      .subscribe((channels) => {
        this.channels = channels
      })
  }

  toggleChannel (channel: any) {
    this.channelsService.updateChannel(channel.name, { isEnabled: !channel.isEnabled })
      .subscribe((_channel) => {
        channel.isEnabled = _channel.isEnabled
      })
  }
}
