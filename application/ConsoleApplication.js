/**
 * @author Ihor Skliar <skliar.ihor@gmail.com>
 * @license MIT
 */
'use strict';

var Jii = require('../index');
var File = require('../helpers/File');
var Request = require('../console/Request');
var Exception = require('../console/Exception');
var Response = require('../console/Response');
var _isEmpty = require('lodash/isEmpty');
var Application = require('../base/Application');
class ConsoleApplication extends Application {

    preInit(config) {
        /**
     * @type {Jii.console.Controller} the currently active controller instance
     */
        this.controller = null;
        /**
     * @type {boolean} whether to enable the commands provided by the core framework.
     * Defaults to true.
     */
        this.enableCoreCommands = true;
        /**
     * @type {string} the default route of this application. Defaults to 'help',
     * meaning the `help` command.
     */
        this.defaultRoute = 'help';
        config = config || {};
        this._request = new Request(this.defaultRoute);
        config = this._loadConfig(config);
        super.preInit(config);
    }

    /**
     * Run console app
     */
    start() {
        return super.start().then(() => {
            return this.handleRequest(this._request);
        }).then(() => {

            // Stop worker after handle request
            this.stop();
        });
    }

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
            if (params[this.constructor.OPTION_APPCONFIG] !== undefined) {
                var path = params[this.constructor.OPTION_APPCONFIG];
                var file = Jii.getAlias(path);
                if (!_isEmpty(path) && File.isFile(file)) {
                    return require(file);
                } else {
                    throw new Exception(Jii.t('jii', 'The configuration file does not exist: {path}', {
                        path: path
                    }));
                }
            }
        }

        return config;
    }

    init() {
        if (this.enableCoreCommands) {
            this.controllerMap = Jii.mergeConfigs(this.coreCommands(), this.controllerMap);
        }
        // ensure we have the 'help' command so that we can list the available commands
        if (!this.controllerMap['help']) {
            this.controllerMap['help'] = this.coreCommands().help;
        }
    }

    /**
     * Handles the specified request.
     * @param {Jii.console.Request} request the request to be handled
     * @returns {Jii.console.Response} the resulting response
     */
    handleRequest(request) {
        var result = request.resolve();

        var context = Jii.createContext({
            route: result[0]
        });
        context.setComponent('request', request);
        context.setComponent('response', new Response());

        return this.runAction(result[0], context);
    }

    /**
     * Returns the configuration of the built-in commands.
     * @returns {object} the configuration of the built-in commands.
     */
    coreCommands() {
        return {
            help: {
                className: require('../console/controllers/HelpController')
            },
            migrate: {
                className: require('../console/controllers/MigrateController')
            }
        };
    }

}

/**
         * The option name for specifying the application configuration file path.
         */
ConsoleApplication.OPTION_APPCONFIG = 'appconfig';
module.exports = ConsoleApplication;