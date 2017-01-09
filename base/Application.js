/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

const Jii = require('../BaseJii');
const File = require('../helpers/File');
const InvalidConfigException = require('../exceptions/InvalidConfigException');
const _isObject = require('lodash/isObject');
const _has = require('lodash/has');
const _each = require('lodash/each');
const Module = require('./Module');

class Application extends Module {

    preInit(config) {
        /**
         * The homepage URL.
         * @type {string}
         */
        this._homeUrl = null;

        /**
         * The root directory of the module.
         * @type {string}
         */
        this._runtimePath = null;

        /**
         * @type {string}
         */
        this.environment = 'development';

        /**
         * @type {string} the language that the application is written in. This mainly refers to
         * the language that the messages and view files are written in.
         * @see language
         */
        this.sourceLanguage = 'en';

        /**
         * @type {string} the language that is meant to be used for end users.
         * @see sourceLanguage
         */
        this.language = 'en';

        /**
         * @type {string} the charset currently used for the application.
         */
        this.charset = 'UTF-8';

        /**
         * @type {string} the version of this application.
         */
        this.version = '1.0';

        /**
         * @type {string} the application name.
         */
        this.name = 'My Application';

        /**
         * @type {string} the namespace that controller classes are in. If not set,
         * it will use the "app\controllers" namespace.
         */
        this.controllerNamespace = 'app.controllers';

        /**
         * The IDs of the components or modules that should be preloaded right after initialization.
         * @type {string[]}
         */
        this.bootstrap = [];

        /**
         * The root directory of the application.
         * @type {string}
         */
        this._basePath = null;

        Jii.app = this;

        // Merge with default config
        config = Jii.mergeConfigs(this._getBaseConfig(), config);

        this._preInit(config);
        this._loadBootstrapComponents();

        super.preInit(null, null, config);
    }

    /**
     *
     * @returns {string}
     */
    getUniqueId() {
        return '';
    }

    /**
     * Sets the root directory of the application and the @app alias.
     * This method can only be invoked at the beginning of the constructor.
     * @param {string} path the root directory of the application.
     */
    setBasePath(path) {
        this._basePath = Jii.getAlias(path);
        Jii.setAlias('@app', this.getBasePath());
    }

    /**
     * Returns the root directory of the module.
     * It defaults to the directory containing the module class file.
     * @return {string} the root directory of the module.
     */
    getBasePath() {
        if (this._basePath === null) {
            this._basePath = process.cwd();
        }

        return this._basePath;
    }

    /**
     * Sets the root directory of the application and the @app alias.
     * This method can only be invoked at the beginning of the constructor.
     * @param {string} path the root directory of the application.
     */
    setRuntimePath(path) {
        this._runtimePath = path;
        Jii.setAlias('@runtime', this.getRuntimePath());
    }

    /**
     * Returns the root directory of the module.
     * It defaults to the directory containing the module class file.
     * @return {string} the root directory of the module.
     */
    getRuntimePath() {
        if (this._runtimePath === null) {
            this._runtimePath = this.getBasePath() + '/runtime';
        }

        return this._runtimePath;
    }


    /**
     * @return {string} the homepage URL
     */
    getHomeUrl() {
        if (this._homeUrl === null) {
            const homeUrl = this.getBasePath();
            return homeUrl[homeUrl.length - 1] == '/'
                ? homeUrl
                : homeUrl + '/';
        } else {
            return this._homeUrl;
        }
    }

    /**
     * Overwrite this method for return default configuration specified for application
     * @type {object} base application's config.
     */
    _getBaseConfig() {
        return {};
    }

    /**
     *
     * @param config
     * @private
     */
    _preInit(config) {
        if (!_isObject(config)) {
            throw new InvalidConfigException('Config must be object');
        }

        if (_has(config, 'basePath')) {
            this.setBasePath(config.basePath);
            delete config.basePath;
        } else if (Jii.isNode) {
            this.setBasePath(File.getFileDirectory(process.argv[1]));
        }

        if (_has(config, 'runtimePath')) {
            this.setRuntimePath(config.runtimePath);
            delete config.runtimePath;
        }
    }

    /**
     * Loads components that are declared in [[bootstrap]].
     * @throws {Jii.exceptions.InvalidConfigException} if a component or module to be preloaded is unknown
     */
    _loadBootstrapComponents() {
        _each(this.bootstrap, id => {
            if (this.hasComponent(id)) {
                this.getComponent(id);
            } else if (this.hasModule(id)) {
                this.getModule(id);
            } else {
                throw new InvalidConfigException('Unknown component or module: ' + id);
            }
        });
    }

}
Application.ENVIRONMENT_TEST = 'test';
Application.ENVIRONMENT_DEVELOPMENT = 'development';

Application.ENVIRONMENT_PRODUCTION = 'production';
module.exports = Application;