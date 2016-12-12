'use strict';

var Jii = require('../../../BaseJii');
// sockjs global fix: sockjs expect that global object is equal window, but it is not always, for example in node-webkit
if (typeof global !== 'undefined' && typeof window !== 'undefined' && global !== window) {
    var usedWindowKeys = [
        'document',
        'location',
        'XMLHttpRequest',
        'EventSource',
        'WebSocket',
        'MozWebSocket',
        'XDomainRequest',
        'crypto',
        'navigator',
        'chrome',
        'addEventListener',
        'attachEvent',
        'removeEventListener',
        'detachEvent',
        'parent',
        'postMessage',
        'console'
    ];
    _each(usedWindowKeys, key => {
        try {
            global[key] = window[key];
        } catch (e) {}
    });
}
// @todo jsonp callbacks
var SockJS = require('sockjs-client');
var Event = require('../../../base/Event');
var MessageEvent = require('../MessageEvent');
var TransportInterface = require('./TransportInterface');
class Sockjs extends TransportInterface {

    preInit() {
        /**
     * @type {SockJS}
     */
        this._websocket = null;
        /**
     * Available:
     * - websocket
     * - xdr-polling
     * - xdr-streaming
     * - xhr-polling
     * - xhr-streaming
     * - eventsource
     * - htmlfile
     * - iframe
     * - jsonp-polling
     */
        this.transports = null;
        super.preInit(...arguments);
    }

    /**
     * Open connection
     * @param {string} url
     */
    open(url) {
        this._websocket = new SockJS(url, null, {
            //debug: HelpOnClick.debug,
            transports: this.transports
        });

        this._websocket.onopen = this._onOpen.bind(this);
        this._websocket.onmessage = this._onMessage.bind(this);
        this._websocket.onclose = this._onClose.bind(this);
    }

    /**
     * Close connection
     */
    close() {
        if (this._websocket) {
            this._websocket.close();
            this._websocket = null;
        }
    }

    /**
     * Send message to server
     * @param {string} message
     */
    send(message) {
        if (this._websocket) {
            this._websocket.send(message);
        }
    }

    _onOpen() {
        this.trigger(Sockjs.EVENT_OPEN, new Event());
    }

    _onClose(errorEvent) {
        this.trigger(Sockjs.EVENT_CLOSE, new Event());
    }

    _onMessage(event) {
        if (event.type === 'message') {
            this.trigger(Sockjs.EVENT_MESSAGE, new MessageEvent({
                message: event.data
            }));
        }
    }

}
module.exports = Sockjs;