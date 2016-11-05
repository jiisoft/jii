/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

var Jii = require('../../BaseJii');
var Client = require('./Client');
var ActiveRecord = require('../../data/BaseActiveRecord');
var InvalidConfigException = require('../../exceptions/InvalidConfigException');
var Collection = require('../../base/Collection');
var _isFunction = require('lodash/isFunction');
var _toArray = require('lodash/toArray');
var _extend = require('lodash/extend');
var _clone = require('lodash/clone');
var _map = require('lodash/map');
var Component = require('../../base/Component');
var NeatComet = require('neatcomet');

/**
 * @class Jii.comet.client.NeatClient
 * @extends Jii.base.Component
 * @implements NeatComet.api.ICometClient
 */
var NeatClient = Jii.defineClass('Jii.comet.client.NeatClient', /** @lends Jii.comet.client.NeatClient.prototype */{

    __extends: Component,

    __static: /** @lends Jii.comet.client.NeatClient */{

        ROUTE_PREFIX: 'profiles:'

    },

    /**
     * @type {Jii.comet.client.Client}
     */
    comet: null,

    /**
     * @type {object}
     */
    bindings: null,

    /**
     * @type {NeatComet.NeatCometClient}
     */
    engine: {
        className: 'NeatComet.NeatCometClient'
    },

    init() {
        this.__super();

        this.comet = this.comet === null ?
            Jii.app.get('comet') :
            (
                this.comet instanceof Component ?
                    this.comet :
                    Jii.createObject(this.comet)
            );

        // Move NeatComet to Jii namespace
        _extend(Jii.namespace('NeatComet'), NeatComet);

        this.engine.comet = this;
        this.engine.profilesDefinition = this.bindings;
        this.engine.createCollection = this.engine.createCollection || this._createCollection.bind(this);
        this.engine.callCollection = this.engine.callCollection || this._callCollection.bind(this);
        this.engine = Jii.createObject(this.engine);
    },

    /**
     *
     * @param profileId
     * @param params
     * @returns {NeatComet.router.OpenedProfileClient}
     */
    openProfile(profileId, params) {
        return this.engine.openProfile(profileId, params);
    },

    /**
     * Allowed to expect that it will be called only once per ICometServer instance
     * @param {NeatComet.api.ICometClientEvents} eventsHandler
     */
    bindEvents(eventsHandler) {
        this.comet.on(Client.EVENT_CHANNEL, event => {
            if (event.channel.indexOf(this.__static.ROUTE_PREFIX) === 0) {
                eventsHandler.onMessage(event.channel.substr(this.__static.ROUTE_PREFIX.length), event.params);
            }
        });

        this.comet.on('open', () => {
            eventsHandler.onConnectionRestore();
        });
    },

    /**
     * @param {object} params
     * @param {NeatComet.api.ICometClient~openSuccess} successCallback
     */
    sendOpen(params, successCallback) {
        this.comet.request('neat/open', { neat: params }).then(data => {

            // Chain with NeatComet handler
            successCallback(data.neat);
        });
    },

    /**
     * @param {string[]} ids
     */
    sendClose(ids) {
        this.comet.request('neat/close', { neat: ids });
    },

    _createCollection(profileId, bindingId, definition, openedProfile) {
        var modelClassName = definition.clientModel || definition.serverModel || ActiveRecord;
        var modelClass = Jii.namespace(modelClassName);

        if (!_isFunction(modelClass)) {
            throw new InvalidConfigException('Not found model class by name, modelClass: ' + modelClassName);
        }

        if (modelClass.getDb && modelClass.getDb()) {
            var rootCollection = modelClass.getDb().getRootCollection(modelClass);
            if (rootCollection) {
                return rootCollection;
            }
        }

        return new Collection([], {
            modelClass: modelClass
        });
    },

    /**
     *
     * @param {Jii.base.Collection} collection
     * @param {string} method
     * @param {*} param1
     * @param {...*} param2
     * @protected
     */
    _callCollection(collection, method, param1, param2) {
        var model;

        if (collection instanceof Collection) {
            switch (method) {
                case 'add':
                    model = collection.createModel(param1);

                    // Mark as exists record (not isNew)
                    model.setOldAttributes(_clone(model.getAttributes()));

                    collection.set(model);
                    return;

                case 'reset':
                    // Convert to models
                    param1 = _map(param1, data => {
                        var model = collection.createModel(data);

                        // Mark as exists record (not isNew)
                        model.setOldAttributes(_clone(model.getAttributes()));

                        return model;
                    });

                    collection.set(param1);
                    return;

                case 'update':
                    model = collection.getById(param2);
                    if (model) {
                        model.set(param1);
                    } else {
                        collection.add(param1);
                    }
                    return;
            }
        }

        collection[method].apply(collection, _toArray(arguments).slice(2));
    }

});

module.exports = NeatClient;