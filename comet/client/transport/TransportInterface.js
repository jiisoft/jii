/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */

'use strict';

var Jii = require('jii');
var Component = require('jii/base/Component');

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
 * @event Jii.comet.client.transport.TransportInterface#log
 * @property {Jii.comet.client.LogMessageEvent} event
 */
TransportInterface.EVENT_LOG = 'log';

/**
 * @event Jii.comet.client.transport.TransportInterface#message
 * @property {Jii.comet.client.MessageEvent} event
 */
TransportInterface.EVENT_MESSAGE = 'message';

/**
 * @event Jii.comet.client.transport.TransportInterface#close
 * @property {Jii.base.Event} event
 */
TransportInterface.EVENT_CLOSE = 'close';

/**
 * @event Jii.comet.client.transport.TransportInterface#open
 * @property {Jii.base.Event} event
 */
TransportInterface.EVENT_OPEN = 'open';
module.exports = TransportInterface;