/**
 * Jii — Full-Stack JavaScript Framework based on PHP Yii 2 Framework architecture.
 *
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

var Neatness = require('neatness').newContext();

/**
 * @namespace
 * @alias module:jii
 */
var Jii = Neatness.namespace('Jii');

/**
 * @class Jii
 */
Jii = Neatness.defineClass('Jii', {

	__static: /** @lends Jii */{

		/**
		 * @alias lodash
		 */
		_: null,

		/**
		 * @alias _s
		 */
		_s: null,

		/**
		 * @type module:when
		 */
		when: null,

		/**
		 * @type {Jii.base.Application}
		 */
		app: null,

		/**
		 * @type {object}
		 */
		aliases: null,

		/**
		 * True, if running in node js
		 * @type {boolean}
		 */
		isNode: false,

		_contextConfig: null,

		/**
		 * Returns framework version
		 * @returns {string}
		 */
		getVersion: function () {
			return require('../package.json').version;
		},

		/**
		 * Get class by full namespace.
		 * @param {string} name
		 * @returns {function|object}
		 */
		namespace: function (name) {
			return Neatness.namespace.apply(Neatness, arguments);
		},

		/**
		 * Move namespace to other object
		 * @param {object} newContext
		 * @param {boolean} [removeFromOld]
		 * @returns {*|Function|Object}
		 */
		namespaceMoveContext: function (newContext, removeFromOld) {
			return Neatness.moveContext.apply(Neatness, arguments);
		},

		/**
		 * Method for define class. Options object will be converter to class prototype.
		 * For set static properties and methods, set param `__static` as object with properties and methods.
		 * For extends from class, set `__extends` property as extended class (function). Example format:
		 *    {
		 *      __extends: Jii.base.Object,
		 *      __static: {
		 *          staticParam: 10,
		 *          MY_CONSTANT: 'constant',
		 *          normalizeName: function() {},
		 *      },
		 *      prototypeParam: 20,
		 *      getName: function() {}
		 * }
		 * @param {string} globalName
		 * @param {object} options
		 * @return {object}
		 */
		defineClass: function (globalName, options) {
			return Neatness.defineClass.apply(Neatness, arguments);
		},

		/**
		 * Create web application, which available by Jii.app
		 * @param {object} config
		 * @returns {Jii.app.Application}
		 */
		createWebApplication: function (config) {
			return this.createApplication('Jii.application.WebApplication', config);
		},

		/**
		 * Create console application, which available by Jii.app
		 * @param {object} config
		 * @returns {Jii.app.Application}
		 */
		createConsoleApplication: function (config) {
			return this.createApplication('Jii.application.ConsoleApplication', config);
		},

		/**
		 * Main method which create application by class name and config.
		 * @param {string} className
		 * @param {object} config
		 * @returns {Jii.app.Application}
		 */
		createApplication: function(className, config) {
			config = config || {};
			config.application = config.application || {};

			// Save context config
			this._contextConfig = config.context || {};

			var ApplicationClass = this.namespace(className);
			if (!Jii._.isFunction(ApplicationClass)) {
				throw new Jii.exceptions.InvalidParamException('Not found application class: ' + className);
			}

			// Init aliases
			this.aliases = {};
			if (this.isNode) {
				this.aliases['@jii'] = __dirname;
			}

			// Create application instance
			return new ApplicationClass(config.application);
		},

		/**
		 * Main method which create application by class name and config.
		 * @param {object} config
		 * @returns {Jii.base.Context}
		 */
		createContext: function(config) {
			config = config || {};

			// Merge with default context config
            config = this.mergeConfigs(this._contextConfig || {}, config);

			if (config.className) {
				var ContextClass = this.namespace(config.className);
				if (!Jii._.isFunction(ContextClass)) {
					throw new Jii.exceptions.InvalidParamException('Not found context class: ' + className);
				}

				return new ContextClass(config);
			}

			return new Jii.base.Context(config);
		},

		/**
		 * Translates a path alias into an actual path.
		 *
		 * The translation is done according to the following procedure:
		 *
		 * 1. If the given alias does not start with '@', it is returned back without change;
		 * 2. Otherwise, look for the longest registered alias that matches the beginning part
		 *    of the given alias. If it exists, replace the matching part of the given alias with
		 *    the corresponding registered path.
		 * 3. Throw an exception or return false, depending on the `$throwException` parameter.
		 *
		 * For example, by default '@jii' is registered as the alias to the Jii framework directory,
		 * say '/path/to/jii'. The alias '@jii/web' would then be translated into '/path/to/jii/web'.
		 *
		 * If you have registered two aliases '@foo' and '@foo/bar'. Then translating '@foo/bar/config'
		 * would replace the part '@foo/bar' (instead of '@foo') with the corresponding registered path.
		 * This is because the longest alias takes precedence.
		 *
		 * However, if the alias to be translated is '@foo/barbar/config', then '@foo' will be replaced
		 * instead of '@foo/bar', because '/' serves as the boundary character.
		 *
		 * Note, this method does not check if the returned path exists or not.
		 *
		 * @param {string} alias the alias to be translated.
		 * @param {boolean} [throwException] whether to throw an exception if the given alias is invalid.
		 * If this is false and an invalid alias is given, false will be returned by this method.
		 * @return {string|boolean} the path corresponding to the alias, false if the root alias is not previously registered.
		 * @throws {Jii.exceptions.InvalidParamException} if the alias is invalid while throwException is true.
		 * @see setAlias()
		 */
		getAlias: function (alias, throwException) {
			if (Jii._.isUndefined(throwException)) {
				throwException = true;
			}

			if (alias.indexOf('@') !== 0) {
				return alias;
			}

			var index = alias.indexOf('/');
			var root = index === -1 ? alias : alias.substr(0, index);

			if (Jii._.has(this.aliases, root)) {
				if (Jii._.isString(this.aliases[root])) {
					return this.aliases[root] + (index !== -1 ? alias.substr(index) : '');
				}

				var finedPath = null;
				Jii._.each(this.aliases[root], function (path, name) {
					var testAlias = alias + '/';
					if (testAlias.indexOf(name + '/') === 0) {
						finedPath = path + alias.substr(name.length);
						return false;
					}
				});
				if (finedPath !== null) {
					return finedPath;
				}
			}

			if (throwException) {
				throw new Jii.exceptions.InvalidParamException('Invalid path alias: ' + alias);
			}
			return false;
		},

		/**
		 * Returns the root alias part of a given alias.
		 * A root alias is an alias that has been registered via [[setAlias()]] previously.
		 * If a given alias matches multiple root aliases, the longest one will be returned.
		 * @param {string} alias the alias
		 * @return {string|boolean} the root alias, or false if no root alias is found
		 */
		getRootAlias: function (alias) {
			var index = alias.indexOf('/');
			var root = index === -1 ? alias : alias.substr(0, index);

			if (Jii._.has(this.aliases, root)) {
				if (Jii._.isString(this.aliases[root])) {
					return root;
				}

				var finedPath = null;
				Jii._.each(this.aliases[root], function (path, name) {
					if (Jii._.indexOf(alias + '/', name + '/') === 0) {
						finedPath = name;
						return false;
					}
				});
				if (finedPath !== null) {
					return finedPath;
				}
			}

			return false;
		},

		/**
		 * Registers a path alias.
		 *
		 * A path alias is a short name representing a long path (a file path, a URL, etc.)
		 * For example, we use '@jii' as the alias of the path to the Jii framework directory.
		 *
		 * A path alias must start with the character '@' so that it can be easily differentiated
		 * from non-alias paths.
		 *
		 * Note that this method does not check if the given path exists or not. All it does is
		 * to associate the alias with the path.
		 *
		 * Any trailing '/' and '\' characters in the given path will be trimmed.
		 *
		 * @param {string} alias the alias name (e.g. "@jii"). It must start with a '@' character.
		 * It may contain the forward slash '/' which serves as boundary character when performing
		 * alias translation by [[getAlias()]].
		 * @param {string} path the path corresponding to the alias. Trailing '/' and '\' characters
		 * will be trimmed. This can be
		 *
		 * - a directory or a file path (e.g. `/tmp`, `/tmp/main.txt`)
		 * - a URL (e.g. `http://example.com`)
		 * - a path alias (e.g. `@jii/base`). In this case, the path alias will be converted into the
		 *   actual path first by calling [[getAlias()]].
		 *
		 * @throws {Jii.exceptions.InvalidParamException} if $path is an invalid alias.
		 * @see getAlias()
		 */
		setAlias: function (alias, path) {
			if (alias.indexOf('@') !== 0) {
				alias = '@' + alias;
			}

			var index = alias.indexOf('/');
			var root = index === -1 ? alias : alias.substr(0, index);

			if (path !== null) {
				path = alias.indexOf('@') !== 0 ? Jii._s.rtrim(path, '/') : this.getAlias(path);

				if (!Jii._.has(this.aliases, root)) {
					if (index === -1) {
						this.aliases[root] = path;
					} else {
						this.aliases[root] = {};
						this.aliases[root][alias] = path;
					}
				} else if (Jii._.isString(this.aliases[root])) {
					if (index === -1) {
						this.aliases[root] = path;
					} else {
						var oldPath = this.aliases[root];
						this.aliases[root] = {};
						this.aliases[root][alias] = path;
						this.aliases[root][root] = oldPath;
					}
				} else {
					this.aliases[root][alias] = path;
					//krsort(static::$aliases[$root]);
				}
			} else if (Jii._.has(this.aliases, root)) {
				if (Jii._.isObject(this.aliases[root])) {
					delete this.aliases[root][alias];
				} else if (index === -1) {
					delete this.aliases[root];
				}
			}
		},

		/**
		 * Creates a new instance using the given configuration.
		 * @param {string|object} config Class name or object with param `className`
		 * @returns {object}
		 */
		createObject: function (config) {
			var className = null;

			// Normalize config
			if (Jii._.isString(config)) {
				className = config;
				config = {};
			} else if (Jii._.has(config, 'className')) {
				config = Jii._.clone(config);
				className = config.className;
				delete config.className;
			} else {
				throw new Jii.exceptions.ApplicationException('Wrong configuration for create object.');
			}

			// Get class
			var objectClass = Jii.namespace(className);
			if (!Jii._.isFunction(objectClass)) {
				throw new Jii.exceptions.ApplicationException('Not found class `' + className + '` for create instance.');
			}

			// Arguments for constructor of class
			var args = [objectClass];
			args = args.concat(Jii._.rest(arguments));
			if (!Jii._.isEmpty(config)) {
				args.push(config);
			}

			// @todo Support old browsers (bind function)
			return new (objectClass.bind.apply(objectClass, args))();
		},

		/**
		 * Set configuration to object. This method find public param in object or setter method.
		 * You can not use setter and public param at the same time for safety reason
		 * @param {Jii.base.Object} object Class instance
		 * @param {object} config Configuration object {key: value, ..}
		 */
		configure: function (object, config) {
			for (var key in config) {
				if (!config.hasOwnProperty(key)) {
					continue;
				}

                if (object instanceof Jii.base.Component) {
                    object.set(key, config[key]);
                    continue;
                }

				// Generate setter name
				var setter = 'set' + Jii._s.capitalize(key);

				if (!Jii._.isFunction(object[setter])) {
					if (Jii._.isFunction(object[key])) {
						throw new Jii.exceptions.InvalidConfigException('You can not replace from config function `' + key + '` in object `' + object.className() + '`.');
					}

					if (Jii._.isUndefined(object[key])) {
						throw new Jii.exceptions.InvalidConfigException('Config param `' + key + '` is undefined in object `' + object.className() + '`.');
					}
				}

				if (!Jii._.isUndefined(object[key]) && !Jii._.isFunction(object[key]) && Jii._.isFunction(object[setter])) {
					throw new Jii.exceptions.InvalidConfigException('You have two setters (function and public param) for config param `' + key + '` in object `' + object.className() + '`.  Please change param access (to `_' + key + '`) or remove setter method.');
				}

				if (!Jii._.isUndefined(object[key]) && !Jii._.isFunction(object[key])) {
					if (Jii._.isObject(object[key]) && Jii._.isObject(config[key]) && !Jii._.isArray(object[key]) && !Jii._.isArray(config[key])) {
						object[key] = Jii.mergeConfigs(object[key], config[key]);
					} else {
						object[key] = config[key];
					}
				} else if (Jii._.isFunction(object[setter])) {
					object[setter].call(object, config[key]);
				}
			}
		},

		/**
		 * Logs a trace message.
		 * Trace messages are logged mainly for development purpose to see
		 * the execution work flow of some code.
		 * @param {string} message the message to be logged.
		 * @param {string} [category] the category of the message.
		 */
		trace: function (message, category) {
			category = category || '';

			console.log(message);
			//if (YII_DEBUG) {
				// @todo static.getLogger().log(message, Logger.LEVEL_TRACE, category);
			//}
		},

		/**
		 * Logs an error message.
		 * An error message is typically logged when an unrecoverable error occurs
		 * during the execution of an application.
		 * @param {string} message the message to be logged.
		 * @param {string} [category] the category of the message.
		 */
		error: function (message, category) {
			category = category || '';

			console.error(message);
			// @todo static.getLogger().log(message, Logger.LEVEL_ERROR, category);
		},

		/**
		 * Logs a warning message.
		 * A warning message is typically logged when an error occurs while the execution
		 * can still continue.
		 * @param {string} message the message to be logged.
		 * @param {string} [category] the category of the message.
		 */
		warning: function (message, category) {
			category = category || '';

			console.warn(message);
			// @todo static.getLogger().log(message, Logger.LEVEL_WARNING, category);
		},

		/**
		 * Logs an informative message.
		 * An informative message is typically logged by an application to keep record of
		 * something important (e.g. an administrator logs in).
		 * @param {string} message the message to be logged.
		 * @param {string} [category] the category of the message.
		 */
		info: function (message, category) {
			category = category || '';

			console.info(message);
			// @todo static.getLogger().log(message, Logger.LEVEL_INFO, category);
		},

		/**
		 * Short alias for translate texts
		 * @param group
		 * @param [message]
		 * @returns {*}
		 */
		t: function (group, message) {
			// @todo
			return message;
		},

        /**
         * @param {object} [obj]
         * @param {object} [obj]
         * @param {object} [obj]
         * @param {object} [obj]
         * @returns {object}
         */
        mergeConfigs: function(obj) {
            var dst = {};

            for (var i = 0, ii = arguments.length; i < ii; ++i) {
                var obj = arguments[i];
                if (!Jii._.isObject(obj)) {
                    continue;
                }

                for (var key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        if (Jii._.isObject(obj[key]) && !Jii._.isArray(obj[key]) && !Jii._.isFunction(obj[key])) {
                            dst[key] = this.mergeConfigs(dst[key], obj[key]);
                        } else {
                            dst[key] = obj[key];
                        }
                    }
                }
            }

            return dst;
        },

        catchHandler: function(e) {
            console.error(e.stack || e)
        }
	}

});

/**
 * @module Jii
 */
module.exports = Jii;