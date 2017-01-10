/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

const Jii = require('../../../BaseJii');
const Component = require('../../../base/Component');

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
 * @event HubInterface#message
 * @property {ChannelEvent} event
 */
HubInterface.EVENT_MESSAGE = 'message';
module.exports = HubInterface;