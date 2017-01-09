/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

const Jii = require('../../../BaseJii');
const LogEvent = require('../../LogEvent');
const Connection = require('../Connection');
const Request = require('../Request');
const MessageEvent = require('../MessageEvent');
const ConnectionEvent = require('../ConnectionEvent');
const TransportInterface = require('./TransportInterface');
const SockJS = require('sockjs');

class SockJs extends TransportInterface {

    preInit() {
        this._server = null;
        this.urlPrefix = '/comet';

        super.preInit(...arguments);
    }

    init() {
        super.init();

        this._server = SockJS.createServer({
            log: (severity, message) => {
                this.trigger(SockJs.EVENT_LOG, new LogEvent({
                    level: this.constructor.LOG_LEVEL_MAPPING[severity] || 'debug',
                    message: message
                }));
            }
        });

        this._server.on('connection', this._addConnection.bind(this));
    }

    /**
     * @param {Server} httpServer
     */
    bindEngine(httpServer) {
        this._server.installHandlers(httpServer, {
            prefix: this.urlPrefix
        });
    }

    /**
     *
     * @param {Jii.comet.server.Connection} connection
     * @param {string} message
     */
    send(connection, message) {
        connection.originalConnection.write(message);
    }

    /**
     *
     * @param {Jii.comet.server.Connection[]} connections
     */
    destroy(connections) {
        connections.forEach(connection => {
            connection.originalConnection.destroy();
        });
    }

    _addConnection(originalConnection) {
        var connection = new Connection({
            id: originalConnection.id,
            originalConnection: originalConnection,
            request: new Request({
                headers: originalConnection.headers,
                ip: originalConnection.ip,
                port: originalConnection.remotePort
            })
        });

        // Trigger on incoming message
        originalConnection.on('data', message => {
            this.trigger(SockJs.EVENT_MESSAGE, new MessageEvent({
                connection: connection,
                message: message
            }));
        });

        // Trigger remove connection on close
        originalConnection.on('close', () => {
            this.trigger(SockJs.EVENT_REMOVE_CONNECTION, new ConnectionEvent({
                connection: connection
            }));
        });

        // Trigger add new connection
        this.trigger(SockJs.EVENT_ADD_CONNECTION, new ConnectionEvent({
            connection: connection
        }));
    }

}

SockJs.LOG_LEVEL_MAPPING = {
    debug: 'debug',
    info: 'debug',
    error: 'error'
}
module.exports = SockJs;