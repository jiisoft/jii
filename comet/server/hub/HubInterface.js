/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

var Jii = require('../../../BaseJii');
var Component = require('../../../base/Component');

class HubInterface extends Component {

    /**
     * Start hub
     */
    start() {
    }

    /**
     * Stop hub
     */
    stop() {
    }

    /**
     * Send message to channel
     * @param {string} channel
     * @param {string} message
     */
    send(channel, message) {
    }

    /**
     * Subscribe to channel
     * @param {string} channel
     */
    subscribe(channel) {
    }

    /**
     * Unsubscribe from channel
     * @param {string} channel
     */
    unsubscribe(channel) {
    }

}

/**
 * @event Jii.comet.server.hub.HubInterface#message
 * @property {Jii.comet.ChannelEvent} event
 */
HubInterface.EVENT_MESSAGE = 'message';
module.exports = HubInterface;