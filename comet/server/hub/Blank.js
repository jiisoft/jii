/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

var Jii = require('../../../BaseJii');
var ChannelEvent = require('../../ChannelEvent');
var HubInterface = require('./HubInterface');

class Blank extends HubInterface {

    preInit() {
        this._channels = {};

        super.preInit(...arguments);
    }

    /**
     * Send message to channel
     * @param {string} channel
     * @param {string} message
     */
    send(channel, message) {
        if (this._channels[channel]) {
            setTimeout(() => {
                this.trigger(Blank.EVENT_MESSAGE, new ChannelEvent({
                    channel: channel,
                    message: message
                }));
            });
        }
    }

    /**
     * Subscribe to channel
     * @param {string} channel
     */
    subscribe(channel) {
        this._channels[channel] = true;
    }

    /**
     * Unsubscribe from channel
     * @param {string} channel
     */
    unsubscribe(channel) {
        delete this._channels[channel];
    }

}
module.exports = Blank;