/**
 * @author Ihor Skliar <skliar.ihor@gmail.com>
 * @license MIT
 */

'use strict';

var Jii = require('jii');
var File = require('jii/helpers/File');
var Request = require('../console/Request');
var Exception = require('../console/Exception');
var Response = require('../console/Response');
var _isEmpty = require('lodash/isEmpty');
var Application = require('jii/base/Application');

/**
 * @class Jii.application.ConsoleApplication
 * @extends Jii.base.Application
 */
var ConsoleApplication = Jii.defineClass('Jii.application.ConsoleApplication', /** @lends Jii.application.ConsoleApplication.prototype */{

    __extends: Application,


    __static: /** @lends Jii.application.ConsoleApplication */{

        /**
         * The option name for specifying the application configuration file path.
         */
        OPTION_APPCONFIG: 'appconfig'

    },

    /**
     * @type {string} the default route of this application. Defaults to 'help',
     * meaning the `help` command.
     */
    defaultRoute: 'help',

    /**
     * @type {boolean} whether to enable the commands provided by the core framework.
     * Defaults to true.
     */
    enableCoreCommands: true,

    /**
     * @type {Jii.console.Controller} the currently active controller instance
     */
    controller: null,

    _request: null,

    /**
     *
     * @param {object} [config]
     */
    constructor(config) {
        config = config || {};

        this._request = new Request(this.defaultRoute);
        config = this._loadConfig(config);

        this.__super(config);
    },

    /**
     * Run console app
     */
    start() {
        return this.__super().then(() => {
            return this.handleRequest(this._request);
        }).then(() => {

            // Stop worker after handle request
            this.stop();
        });
    },

    /**
     * Loads the configuration.
     * This method will check if the command line option [[OPTION_APPCONFIG]] is specified.
     * If so, the corresponding file will be loaded as the application configuration.
     * Otherwise, the configuration provided as the parameter will be returned back.
     * @param {object} config the configuration provided in the constructor.
     * @returns {[]} the actual configuration to be used by the application.
     */
    _loadConfig(config) {
        if (!_isEmpty(process.argv)) {
            var params = this._request.getParams();
            if (params[this.__static.OPTION_APPCONFIG] !== undefined) {
                var path = params[this.__static.OPTION_APPCONFIG];
                var file = Jii.getAlias(path);
                if (!_isEmpty(path) && File.isFile(file)) {
                    return require(file);
                } else {
                    throw new Exception(Jii.t('jii', "The configuration file does not exist: {path}", {path: path}));
                }
            }
        }

        return config;
    },


    init() {
        if (this.enableCoreCommands) {
            this.controllerMap = Jii.mergeConfigs(this.coreCommands(), this.controllerMap);
        }
        // ensure we have the 'help' command so that we can list the available commands
        if (!this.controllerMap['help']) {
            this.controllerMap['help'] = this.coreCommands().help;
        }
    },

    /**
     * Handles the specified request.
     * @param {Jii.console.Request} request the request to be handled
     * @returns {Jii.console.Response} the resulting response
     */
    handleRequest(request) {
        var result = request.resolve();

        var context = Jii.createContext({route: result[0]});
        context.setComponent('request', request);
        context.setComponent('response', new Response());

        return this.runAction(result[0], context);
    },

    /**
     * Returns the configuration of the built-in commands.
     * @returns {object} the configuration of the built-in commands.
     */
    coreCommands() {
        var commands = {
            help: {
                className: require('../console/controllers/HelpController')
            }
        };

        var isArSqlExists = false;
        try {
            require('jii-ar-sql'); // @todo Create helper for check
            isArSqlExists = true;
        } catch (e) {}
        if (isArSqlExists) {
            commands.migrate = {
                className: require('jii-ar-sql/server/controllers/MigrateController')
            };
        }

        return commands;
    }
});

module.exports = ConsoleApplication;