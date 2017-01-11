/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

const Jii = require('../../../BaseJii');
const Component = require('../../../base/Component');

class TransportInterface extends Component {

    /**
     * @param {Server} httpServer
     */
    bindEngine(httpServer) {
    }

    /**
     *
     * @param {object} connection
     * @return {{headers: object, ip: string, remotePort: number}}
     */
    parseRequest(connection) {
    }

    /**
     *
     * @param {object} connection
     * @param {string} message
     */
    send(connection, message) {
    }

    /**
     *
     * @param {object[]} connections
     */
    destroy(connections) {
    }

}

/**
 * @event TransportInterface#log
 * @property {LogEvent} event
 */
TransportInterface.EVENT_LOG = 'log';

/**
 * @event TransportInterface#message
 * @property {MessageEvent} event
 */
TransportInterface.EVENT_MESSAGE = 'message';

/**
 * @event TransportInterface#removeConnection
 * @property {ConnectionEvent} event
 */
TransportInterface.EVENT_REMOVE_CONNECTION = 'removeConnection';

/**
 * @event TransportInterface#addConnection
 * @property {ConnectionEvent} event
 */
TransportInterface.EVENT_ADD_CONNECTION = 'addConnection';
module.exports = TransportInterface;