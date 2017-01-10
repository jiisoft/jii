/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */

'use strict';

const Jii = require('jii');
const Component = require('jii/base/Component');

class TransportInterface extends Component {

    /**
     * Open connection
     * @param {string} url
     */
    open(url) {
    }

    /**
     * Close connection
     */
    close() {
    }

    /**
     * Send message to server
     * @param {string} message
     */
    send(message) {
    }

}

/**
 * @event TransportInterface#log
 * @property {LogMessageEvent} event
 */
TransportInterface.EVENT_LOG = 'log';

/**
 * @event TransportInterface#message
 * @property {MessageEvent} event
 */
TransportInterface.EVENT_MESSAGE = 'message';

/**
 * @event TransportInterface#close
 * @property {Event} event
 */
TransportInterface.EVENT_CLOSE = 'close';

/**
 * @event TransportInterface#open
 * @property {Event} event
 */
TransportInterface.EVENT_OPEN = 'open';
module.exports = TransportInterface;