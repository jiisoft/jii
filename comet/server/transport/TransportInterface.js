'use strict';

var Jii = require('../../../BaseJii');
var Component = require('../../../base/Component');
class TransportInterface extends Component {

    /**
     * @param {Server} httpServer
     */
    bindEngine(httpServer) {}

    /**
     *
     * @param {object} connection
     * @return {{headers: object, ip: string, remotePort: number}}
     */
    parseRequest(connection) {}

    /**
     *
     * @param {object} connection
     * @param {string} message
     */
    send(connection, message) {}

    /**
     *
     * @param {object[]} connections
     */
    destroy(connections) {}

}

/**
         * @event Jii.comet.server.transport.TransportInterface#log
         * @property {Jii.comet.LogEvent} event
         */
TransportInterface.EVENT_LOG = 'log';

/**
         * @event Jii.comet.server.transport.TransportInterface#message
         * @property {Jii.comet.server.MessageEvent} event
         */
TransportInterface.EVENT_MESSAGE = 'message';

/**
         * @event Jii.comet.server.transport.TransportInterface#removeConnection
         * @property {Jii.comet.server.transport.ConnectionEvent} event
         */
TransportInterface.EVENT_REMOVE_CONNECTION = 'removeConnection';

/**
         * @event Jii.comet.server.transport.TransportInterface#addConnection
         * @property {Jii.comet.server.transport.ConnectionEvent} event
         */
TransportInterface.EVENT_ADD_CONNECTION = 'addConnection';
module.exports = TransportInterface;