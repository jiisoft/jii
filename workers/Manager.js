/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

var Jii = require('jii');
var Environment = require('jii/application/Environment');
var MasterWorker = require('./MasterWorker');
var ChildWorker = require('./ChildWorker');
var _isFunction = require('lodash/isFunction');
var _isObject = require('lodash/isObject');
var _uniqueId = require('lodash/uniqueId');
var _isString = require('lodash/isString');
var _isEmpty = require('lodash/isEmpty');
var _each = require('lodash/each');
var Object = require('jii/base/Object');
var cluster = require('cluster');
var ConsoleApplication = require('jii/application/ConsoleApplication');

/**
 * @class Jii.workers.Manager
 * @extends Jii.base.Object
 */
var Manager = Jii.defineClass('Jii.workers.Manager', /** @lends Jii.workers.Manager.prototype */{

    __extends: Object,

    __static: /** @lends Jii.workers.Manager */{

        CONSOLE_APP_NAME: 'console'

    },

    /**
     * @type {Jii.application.Environment}
     */
    _environment: null,

    /**
     * @type {object}
     */
    _applicationConfigs: {},

    /**
     * @type {Jii.workers.Service}
     */
    _service: null,

    init() {
        this._environment = new Environment({
            name: Environment.NAME_PRODUCTION
        });
    },

    /**
     *
     * @param name
     * @return {Jii.workers.Manager}
     */
    setEnvironment(name) {
        this._environment.setName(name);
        return this;
    },

    /**
     * Callback function to be called when folder loaded from server.
     * @callback Jii.workers.Manager~applicationConfigCallback
     * @param {Jii.application.Environment} environment
     */

    /**
     *
     * @param {object|function|string|string[]} names
     * @param {object|Jii.workers.Manager~applicationConfigCallback} [config]
     * @returns {Jii.workers.Manager}
     */
    application(names, config) {
        if (_isFunction(names) || _isObject(names)) {
            config = names;
            names = [_uniqueId('app')];
        }
        if (_isString(names)) {
            names = [names];
        }
        if (names.length === 0) {
            return this;
        }

        // Lazy start
        if (_isEmpty(this._applicationConfigs)) {
            setTimeout(this._start.bind(this));
        }

        _each(names, name => {
            this._applicationConfigs[name] = _isFunction(config) ? config(this._environment, name) : config;
        });

        return this;
    },

    _start() {
        // Run as console application
        if (process.argv.length > 2) {
            var cliConfig = Jii.mergeConfigs(
                {
                    application: {
                        basePath: process.cwd(),
                        controllerMap: {
                            service: require('jii/console/controllers/ServiceController')
                        }
                    }
                },
                this._applicationConfigs[this.__static.CONSOLE_APP_NAME] || {}
            );
            Jii.createApplication(ConsoleApplication, cliConfig).start();
        } else {

            // Web application
            if (cluster.isMaster) {
                var master = new MasterWorker();
                _each(this._applicationConfigs, (config, name) => {
                    if (name === this.__static.CONSOLE_APP_NAME) {
                        return;
                    }

                    config.workers = config.workers || 1;

                    for (var i = 1; i <= config.workers; i++) {
                        master.fork(name);
                    }
                });
            } else {
                var name = process.env.JII_APPLICATION_NAME;
                if (name !== this.__static.CONSOLE_APP_NAME) {
                    var childWorker = new ChildWorker({
                        name: name,
                        index: process.env.JII_WORKER_INDEX,
                        config: this._applicationConfigs[name]
                    });
                    childWorker.start();
                }
            }
        }
    }

});

module.exports = Manager;