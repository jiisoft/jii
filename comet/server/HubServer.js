/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

var Jii = require('../../BaseJii');
var String = require('../../helpers/String');
var HubInterface = require('./hub/HubInterface');
var ChannelEvent = require('../ChannelEvent');
var Request = require('./Request');
var Connection = require('./Connection');
var Response = require('./Response');
var _extend = require('lodash/extend');
var Component = require('../../base/Component');
var RedisHub = require('./hub/Redis');
var RedisQueue = require('./queue/Redis');

/**
 * @class Jii.comet.server.HubServer
 * @extends Jii.base.Component
 */
var HubServer = Jii.defineClass('Jii.comet.server.HubServer', /** @lends Jii.comet.server.HubServer.prototype */{

	__extends: Component,

	__static: /** @lends Jii.comet.server.HubServer */{

		/**
		 * @event Jii.comet.server.HubServer#channel
		 * @property {Jii.comet.ChannelEvent} event
		 */
		EVENT_CHANNEL: 'channel',

		/**
		 * @event Jii.comet.server.HubServer#channel:%channel_name%
		 * @property {Jii.comet.ChannelEvent} event
		 */
		EVENT_CHANNEL_NAME: 'channel:',

		/**
		 * @event Jii.comet.server.HubServer#message
		 * @property {Jii.comet.server.MessageEvent} event
		 */
		EVENT_MESSAGE: 'message',

		/**
		 * @type {string}
		 */
		CHANNEL_NAME_ALL: '__allVfcOS7',

		/**
		 * @type {string}
		 */
		CHANNEL_NAME_ACTION: '__actionXZj1sf',

		/**
		 * @type {string}
		 */
		CHANNEL_NAME_CONNECTION: '__connectionN9a63w:'

	},

	/**
	 * @type {boolean}
	 */
	listenActions: true,

	/**
	 * @type {Jii.comet.server.hub.HubInterface}
	 */
	hub: {
		className: RedisHub
	},

	/**
	 * @type {Jii.comet.server.queue.QueueInterface}
	 */
	queue: {
		className: RedisQueue
	},

	/**
	 * @type {string}
	 */
	_serverUid: null,

	init() {
		this.__super();

		// Generate unique server uid
		this._serverUid = String.generateUid();

		// Init hub
		this.hub = Jii.createObject(this.hub);
		this.hub.on(HubInterface.EVENT_MESSAGE, this._onHubMessage.bind(this));

		// Init queue
		this.queue = Jii.createObject(this.queue);
	},

	/**
	 * Start listen income comet connections
	 */
	start() {
		return Promise.all([
			this.hub.start(),
			this.queue.start()
		]).then(() => {
			if (this.listenActions) {
				this.hub.subscribe(this.__static.CHANNEL_NAME_ACTION);
                this._runActionFromQueue();
			}
		});
	},

	/**
	 * Abort current connections and stop listen income comet connections
	 */
	stop() {
		return Promise.all([
			this.hub.stop(),
			this.queue.stop()
		]);
	},

	/**
	 * Send data to channel
	 * @param {string} channel
	 * @param {*} data
	 */
	sendToChannel(channel, data) {
		if (typeof data !== 'string') {
			data = JSON.stringify(data);
		}

		Jii.trace('Comet server send to channel `' + channel + '` data: ' + data);
		this.hub.send(channel, data);
		this.hub.send(this.__static.CHANNEL_NAME_ALL, channel + ' ' + data);
	},

	/**
	 *
	 * @param {string} name
	 * @param {function} handler
	 * @param {*} [data]
	 * @param {boolean} [isAppend]
	 */
	on(name, handler, data, isAppend) {
		// Subscribe on hub channels
		if (name === this.__static.EVENT_CHANNEL && !this.hasEventHandlers(name)) {
			this.hub.subscribe(this.__static.CHANNEL_NAME_ALL);
		}
		if (name.indexOf(this.__static.EVENT_CHANNEL_NAME) === 0) {
			var channel = name.substr(this.__static.EVENT_CHANNEL_NAME.length);
			if (!this.hasChannelHandlers(channel)) {
				this.hub.subscribe(channel);
			}
		}

		this.__super.apply(this, arguments);
	},

	/**
	 * @param {string} name
	 * @param {function} [handler]
	 * @return boolean
	 */
	off(name, handler) {
		this.__super.apply(this, arguments);

		// Unsubscribe on hub channels
		if (name === this.__static.EVENT_CHANNEL && !this.hasEventHandlers(name)) {
			this.hub.unsubscribe(this.__static.CHANNEL_NAME_ALL);
		}
		if (name.indexOf(this.__static.EVENT_CHANNEL_NAME) === 0) {
			var channel = name.substr(this.__static.EVENT_CHANNEL_NAME.length);
			if (!this.hasChannelHandlers(channel)) {
				this.hub.unsubscribe(channel);
			}
		}
	},

	/**
	 *
	 * @param {string} name
	 * @returns {boolean}
	 */
	hasChannelHandlers(name) {
		return this.hasEventHandlers(this.__static.EVENT_CHANNEL_NAME + name);
	},

	/**
	 * Send data to connection
	 * @param {number|string} id
	 * @param {*} data
	 */
	sendToConnection(id, data) {
		if (typeof data !== 'string') {
			data = JSON.stringify(data);
		}

		Jii.trace('Comet server send to connection `' + id + '` data: ' + data);

		this.hub.send(this.__static.CHANNEL_NAME_CONNECTION + id, data);
	},

	/**
	 *
	 * @param {Jii.comet.server.Connection} connection
	 * @param {string} route
	 * @param {object} data
	 */
	pushActionToQueue(connection, route, data) {
		var queueData = {
            route: route,
			connection: connection.toJSON(),
			request: connection.request.toJSON()
		};
        queueData.request.queryParams = data;
		this.queue.push(JSON.stringify(queueData)).then(() => {

			// Notify hub servers about new action
			this.hub.send(this.__static.CHANNEL_NAME_ACTION, route);
		});
	},

	/**
	 * Income message from hub
	 * @param {Jii.comet.ChannelEvent} event
	 * @private
	 */
	_onHubMessage(event) {
		Jii.trace('Comet hub income, channel `' + event.channel + '`: ' + event.message);

		this.trigger(this.__static.EVENT_MESSAGE, new ChannelEvent({
			channel: event.channel,
			message: event.message
		}));

		switch (event.channel) {
			case this.__static.CHANNEL_NAME_ACTION:
				var route = event.message;

				if (route && Jii.app.existsRoute(route)) {
                    this._runActionFromQueue();
				}
				break;

			case this.__static.CHANNEL_NAME_ALL:
				var i2 = event.message.indexOf(' ');
				this.trigger(this.__static.EVENT_CHANNEL, new ChannelEvent({
					channel: event.message.substr(0, i2),
					message: event.message.substr(i2 + 1)
				}));
				break;

			default:
				this.trigger(this.__static.EVENT_CHANNEL_NAME + event.channel, new ChannelEvent({
					channel: event.channel,
					message: event.message
				}));
		}
	},

    _runActionFromQueue() {
        this.queue.pop().then(message => {
            // Empty queue - skip
            if (message === null) {
                return false;
            }

            Jii.trace('Run action from queue: ' + message);

            var data = JSON.parse(message);
            if (Jii.app.existsRoute(data.route)) {
                var context = Jii.createContext({route: data.route});

                data.request.uid = data.request.queryParams ? data.request.queryParams.requestUid : null;

                context.setComponent('request', new Request(data.request));
                context.setComponent('connection', new Connection(_extend({}, data.connection, {
                    request: context.get('request')
                })));
                context.setComponent('response', new Response({
                    comet: this,
                    requestUid: data.request.uid,
                    connectionId: context.get('connection').id
                }));

                // @todo return Promise
                Jii.app.runAction(data.route, context);
            }

            // Run next action
            this._runActionFromQueue();
        })
            .catch(Jii.catchHandler);
    }

});

module.exports = HubServer;