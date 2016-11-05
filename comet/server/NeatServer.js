/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

var Jii = require('../../BaseJii');
var Server = require('./Server');
var Component = require('../../base/Component');
var Event = require('../../base/Event');
var ActiveRecord = require('../../data/BaseActiveRecord');
var InvalidConfigException = require('../../exceptions/InvalidConfigException');
var _isFunction = require('lodash/isFunction');
var _isEmpty = require('lodash/isEmpty');
var _extend = require('lodash/extend');
var Object = require('../../base/Object');
var NeatComet = require('neatcomet');

/**
 * @class Jii.comet.server.NeatServer
 * @extends Jii.base.Object
 * @implements NeatComet.api.ICometServer
 * @implements NeatComet.api.IOrmLoader
 */
var NeatServer = Jii.defineClass('Jii.comet.server.NeatServer', /** @lends Jii.comet.server.NeatServer.prototype */{

    __extends: Object,

    __static: /** @lends Jii.comet.server.NeatServer */{

        ROUTE_PREFIX: 'profiles:'

    },

    /**
     * @type {string}
     * @deprecated
     */
    configFileName: null,

    /**
     * @type {object}
     */
    bindings: null,

    /**
     * @type {Jii.comet.server.Server}
     **/
    comet: null,

    /**
     * Callback function to be called when folder loaded from server.
     * @callback Jii.comet.server.NeatServer~dataLoadHandlerCallback
     * @param {object} params
     * @returns {Promise}
     */

    /**
     * @type {Jii.comet.server.NeatServer~dataLoadHandlerCallback}
     */
    dataLoadHandler: null,

    /**
     * @type {object|boolean}
     */
    hasDynamicAttributes: false,

    /**
     * @type {boolean}
     */
    listenModels: true,

    /**
     * Note: onOpenProfileCommand() and onCloseProfileCommand must be called from actions explicitly.
     * There's no way to subscribe for them in Jii.
     *
     * @type {NeatComet.api.ICometServerEvents}
     */
    _events: null,

    /**
     * @type {NeatComet.NeatCometServer}
     */
    engine: null,

    init() {
        this.__super();

        // Init transport
        this.comet = this.comet === null ?
            Jii.app.get('comet') :
            (
                this.comet instanceof Component ?
                    this.comet :
                    Jii.createObject(this.comet)
            );

        this.engine = new NeatComet.NeatCometServer();
        this.engine.setup({
            comet: this,
            ormLoader: this,
            configFileName: this.configFileName || this.bindings,
            externalDataLoader: this.dataLoadHandler
        });

        Jii.app.inlineActions['neat/open'] = this._actionOpenProfile.bind(this);
        Jii.app.inlineActions['neat/close'] = this._actionCloseProfile.bind(this);

        if (this.listenModels && ActiveRecord) {
            Event.on(ActiveRecord.className(), ActiveRecord.EVENT_AFTER_INSERT, this._onModelInsert.bind(this));
            Event.on(ActiveRecord.className(), ActiveRecord.EVENT_AFTER_UPDATE, this._onModelUpdate.bind(this));
            Event.on(ActiveRecord.className(), ActiveRecord.EVENT_AFTER_DELETE, this._onModelDelete.bind(this));
        }
    },

    /**
     * Allowed to expect that it will be called only once per ICometServer instance
     * @param {NeatComet.api.ICometServerEvents} eventsHandler
     */
    bindServerEvents(eventsHandler) {
        this._events = eventsHandler;

        this.comet.on(Server.EVENT_ADD_CONNECTION, event => {
            eventsHandler.onNewConnection(event.connection.id);
        });
        this.comet.on(Server.EVENT_REMOVE_CONNECTION, event => {
            eventsHandler.onLostConnection(event.connection.id);
        });
    },

    /**
     * @return {boolean}
     */
    getSupportsForwardToClient() {
        // TODO: Implement
        return false;
    },

    /**
     * @param {String} channel
     * @param {*} message
     */
    broadcast(channel, message) {
        this.comet.sendToChannel(this.__static.ROUTE_PREFIX + channel, message);
    },

    /**
     * @param {String} channel
     * @param {Function} callback
     */
    subscribe(channel, callback) {
        /**
         * @param Jii.comet.ChannelEvent event
         */
        callback.__jiiCallbackWrapper = event => {
            callback(event.channel.substr(this.__static.ROUTE_PREFIX.length), JSON.parse(event.message));
        };

        this.comet.on('channel:' + this.__static.ROUTE_PREFIX + channel, callback.__jiiCallbackWrapper);
    },

    /**
     * @param {String} channel
     * @param {Function} callback
     */
    unsubscribe(channel, callback) {
        if (callback && callback.__jiiCallbackWrapper) {
            callback = callback.__jiiCallbackWrapper;
        }
        this.comet.off('channel:' + this.__static.ROUTE_PREFIX + channel, callback);
    },

    /**
     *
     * @param connectionId
     * @param channel
     * @param data
     */
    pushToClient(connectionId, channel, data) {
        this.comet.sendToConnection(connectionId, [
            'channel',
            this.__static.ROUTE_PREFIX + channel,
            JSON.stringify(data)
        ].join(' '));
    },

    /**
     * @param {string|Jii.data.ActiveQuery} modelClassName
     * @param {object|null} match
     * @param {string} whereType
     * @param {string|null} where
     * @param {object} attributes
     * @param {NeatComet.bindings.BindingServer} binding
     * @returns {Promise} Array of records data
     */
    loadRecords(modelClassName, match, whereType, where, attributes, binding) {

        /** @typedef {Jii.data.BaseActiveRecord} modelClass  */
        var modelClass = Jii.namespace(modelClassName);
        if (!_isFunction(modelClass)) {
            throw new InvalidConfigException('Not found model `' + modelClassName + '` for binding');
        }

        /** @typedef {Jii.data.ActiveQuery} query  */
        var query = modelClass.find();

        // Apply match condition
        if (match) {
            query.where(match);
        }

        // Apply custom filter
        switch (whereType) {

            case NeatComet.api.IOrmLoader.WHERE_NONE:
                // Find all
                break;

            case NeatComet.api.IOrmLoader.WHERE_JS:
                where = NeatComet.bindings.BindingServer.convertWhereJsToSql(where);
                break;

            case NeatComet.api.IOrmLoader.WHERE_SQL:
                where = NeatComet.bindings.BindingServer.convertWhereJsToSql(where);
                query
                    .from(modelClass.tableName() + ' ' + NeatComet.api.IOrmLoader.TABLE_ALIAS_IN_SQL)
                    .andWhere(where, NeatComet.bindings.BindingServer.filterAttributesBySqlParams(where, attributes));
                break;

            default:
                throw new InvalidConfigException('Where type `' + whereType + '` is not implemented');
        }

        // Query via model implementation
        if (!_isEmpty(this.hasDynamicAttributes)) {
            // @todo
        } else {
            if (binding.attributes !== null) {
                query.select(binding.attributes);
            }
            return query.asArray().all();
        }
    },

    /**
     *
     * @param {Jii.data.AfterSaveEvent} event
     * @param {} event.sender
     * @private
     */
    _onModelInsert(event) {
        /** @typedef {ActiveRecord} model */
        var model = event.sender;

        this.engine.broadcastEvent(model.className(), 'sendAdd', model.getAttributes());
    },

    /**
     *
     * @param {Jii.data.AfterSaveEvent} event
     * @param {ActiveRecord} event.sender
     * @private
     */
    _onModelUpdate(event) {
        /** @typedef {ActiveRecord} model */
        var model = event.sender;

        var oldAttributes = _extend({}, event.changedAttributes, model.getOldAttributes());
        this.engine.broadcastEvent(model.className(), 'sendUpdate', model.getAttributes(), oldAttributes);
    },

    /**
     *
     * @param {Jii.base.Event} event
     * @param {ActiveRecord} event.sender
     * @private
     */
    _onModelDelete(event) {
        /** @typedef {ActiveRecord} model */
        var model = event.sender;

        this.engine.broadcastEvent(model.className(), 'sendRemove', model.getAttributes());
    },

    /**
     * @param {Jii.base.Context} context
     * @param {Jii.comet.server.Connection} context.connection
     * @param {Jii.comet.server.Request} context.request
     * @param {Jii.comet.server.Response} context.response
     */
    _actionOpenProfile(context) {
        this._events
            .onOpenProfileCommand(context.connection.id, context.request.get('neat'))
            .then(neatResponse => {
                context.response.data = {neat: neatResponse};
                context.response.send();
            });
    },

    /**
     * @param {Jii.base.Context} context
     * @param {Jii.comet.server.Connection} context.connection
     * @param {Jii.comet.server.Request} context.request
     * @param {Jii.comet.server.Response} context.response
     */
    _actionCloseProfile(context) {
        context.response.send(); // No wait
        this._events.onCloseProfileCommand(context.connection.id, context.request.get('neat'));
    }

});

module.exports = NeatServer;