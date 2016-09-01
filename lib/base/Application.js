/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

/**
 * @namespace Jii
 * @ignore
 */
var Jii = require('../Jii');

require('./Module');

/**
 * @class Jii.base.Application
 * @extends Jii.base.Module
 */
Jii.defineClass('Jii.base.Application', /** @lends Jii.base.Application.prototype */{

	__extends: 'Jii.base.Module',

	__static: /** @lends Jii.base.Application */{

		ENVIRONMENT_PRODUCTION: 'production',
		ENVIRONMENT_DEVELOPMENT: 'development',
		ENVIRONMENT_TEST: 'test'

	},

	/**
	 * @type {string} the namespace that controller classes are in. If not set,
	 * it will use the "app\controllers" namespace.
	 */
	controllerNamespace: 'app.controllers',

	/**
	 * @type {string} the application name.
	 */
	name: 'My Application',

	/**
	 * @type {string} the version of this application.
	 */
	version: '1.0',

	/**
	 * @type {string} the charset currently used for the application.
	 */
	charset: 'UTF-8',

	/**
	 * @type {string} the language that is meant to be used for end users.
	 * @see sourceLanguage
	 */
	language: 'en',

	/**
	 * @type {string} the language that the application is written in. This mainly refers to
	 * the language that the messages and view files are written in.
	 * @see language
	 */
	sourceLanguage: 'en',

	/**
	 * The IDs of the components or modules that should be preloaded right after initialization.
	 * @type {string[]}
	 */
	bootstrap: null,

	/**
	 * @type {string}
	 */
	environment: 'development',

    /**
     * The root directory of the module.
     * @type {string}
     */
    _runtimePath: null,

	/**
	 * @constructs
	 */
	constructor(config) {
		Jii.app = this;

		this.bootstrap = [];

		// Merge with default config
		config = Jii.mergeConfigs(this._getBaseConfig(), config);

		this._preInit(config);
		this._loadBootstrapComponents();

		this.__super(null, null, config);
	},

	/**
	 *
	 * @returns {string}
	 */
	getUniqueId() {
		return '';
	},

    /**
     * Sets the root directory of the application and the @app alias.
     * This method can only be invoked at the beginning of the constructor.
     * @param {string} path the root directory of the application.
     */
    setBasePath(path) {
        this.__super(path);
        Jii.setAlias('@app', this.getBasePath());
    },

    /**
     * Sets the root directory of the application and the @app alias.
     * This method can only be invoked at the beginning of the constructor.
     * @param {string} path the root directory of the application.
     */
    setRuntimePath(path) {
		this._runtimePath = path;
        Jii.setAlias('@runtime', this.getRuntimePath());
    },

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
    },

	/**
	 * Overwrite this method for return default configuration specified for application
	 * @type {object} base application's config.
	 */
	_getBaseConfig() {
		return {};
	},

	/**
	 *
	 * @param config
	 * @private
	 */
	_preInit(config) {
		if (!Jii._.isObject(config)) {
			throw new Jii.exceptions.InvalidConfigException('Config must be object');
		}

		if (Jii._.has(config, 'basePath')) {
			this.setBasePath(config.basePath);
			delete config.basePath;
		} else if (Jii.isNode) {
            this.setBasePath(Jii.helpers.File.getFileDirectory(process.argv[1]));
		}

        if (Jii._.has(config, 'runtimePath')) {
            this.setRuntimePath(config.runtimePath);
            delete config.runtimePath;
        }
	},

	/**
	 * Loads components that are declared in [[bootstrap]].
	 * @throws {Jii.exceptions.InvalidConfigException} if a component or module to be preloaded is unknown
	 */
	_loadBootstrapComponents() {
		Jii._.each(this.bootstrap, id => {
			if (this.hasComponent(id)) {
				this.getComponent(id);
			} else if (this.hasModule(id)) {
				this.getModule(id);
			} else {
				throw new Jii.exceptions.InvalidConfigException("Unknown component or module: " + id);
			}
		});
	}
});
