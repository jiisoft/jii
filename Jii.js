/**
 * Jii — Full-Stack JavaScript Framework based on PHP Yii 2 Framework architecture.
 *
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

const neatness = require('neatness');
const _isString = require('lodash/isString');
const _isFunction = require('lodash/isFunction');
const _isUndefined = require('lodash/isUndefined');
const _has = require('lodash/has');
const _each = require('lodash/each');
const _indexOf = require('lodash/indexOf');
const _isObject = require('lodash/isObject');
const _clone = require('lodash/clone');
const _drop = require('lodash/drop');
const _isEmpty = require('lodash/isEmpty');
const _isArray = require('lodash/isArray');
const _trimEnd = require('lodash/trimEnd');
const _upperFirst = require('lodash/upperFirst');
const _extend = require('lodash/extend');
const BaseJii = require('./BaseJii');
const WebApplication = require('./application/WebApplication');
const InvalidParamException = require('./exceptions/InvalidParamException');
const ApplicationException = require('./exceptions/ApplicationException');
const InvalidConfigException = require('./exceptions/InvalidConfigException');
const BaseObject = require('./base/BaseObject');
const Context = require('./base/Context');
const Component = require('./base/Component');
const Util = require('./helpers/Util');

/**
 * @class Jii
 * @extends BaseJii
 */
var Jii = _extend(BaseJii, /** @lends Jii */{

    /**
     * @type {Jii.base.Application}
     */
    app: null,

    /**
     * @type {object}
     */
    aliases: null,

    _contextConfig: null,

    /**
     * Create web application, which available by Jii.app
     * @param {object} config
     * @returns {Jii.app.Application}
     */
    createWebApplication(config) {
        return this.createApplication(WebApplication, config);
    },

    /**
     * Main method which create application by class name and config.
     * @param {string} className
     * @param {object} config
     * @returns {Jii.app.Application}
     */
    createApplication(className, config) {
        config = config || {};
        config.application = config.application || {};

        // Save context config
        this._contextConfig = config.context || {};

        var ApplicationClass = this.namespace(className);
        if (!_isFunction(ApplicationClass)) {
            throw new InvalidParamException('Not found application class: ' + className);
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
     * @returns {Context}
     */
    createContext(config) {
        config = config || {};

        // Merge with default context config
        config = this.mergeConfigs(this._contextConfig || {}, config);

        if (config.className) {
            var ContextClass = this.namespace(config.className);
            if (!_isFunction(ContextClass)) {
                throw new InvalidParamException('Not found context class: ' + className);
            }

            return new ContextClass(config);
        }

        return new Context(config);
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
     * @throws {InvalidParamException} if the alias is invalid while throwException is true.
     * @see setAlias()
     */
    getAlias(alias, throwException) {
        if (_isUndefined(throwException)) {
            throwException = true;
        }

        if (alias.indexOf('@') !== 0) {
            return alias;
        }

        var index = alias.indexOf('/');
        var root = index === -1 ? alias : alias.substr(0, index);

        if (_has(this.aliases, root)) {
            if (_isString(this.aliases[root])) {
                return this.aliases[root] + (index !== -1 ? alias.substr(index) : '');
            }

            var finedPath = null;
            _each(this.aliases[root], (path, name) => {
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
            throw new InvalidParamException('Invalid path alias: ' + alias);
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
    getRootAlias(alias) {
        var index = alias.indexOf('/');
        var root = index === -1 ? alias : alias.substr(0, index);

        if (_has(this.aliases, root)) {
            if (_isString(this.aliases[root])) {
                return root;
            }

            var finedPath = null;
            _each(this.aliases[root], (path, name) => {
                if (_indexOf(alias + '/', name + '/') === 0) {
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
     * @throws {InvalidParamException} if $path is an invalid alias.
     * @see getAlias()
     */
    setAlias(alias, path) {
        if (alias.indexOf('@') !== 0) {
            alias = '@' + alias;
        }

        var index = alias.indexOf('/');
        var root = index === -1 ? alias : alias.substr(0, index);

        if (path !== null) {
            path = alias.indexOf('@') !== 0 ? _trimEnd(path, '/') : this.getAlias(path);

            if (!_has(this.aliases, root)) {
                if (index === -1) {
                    this.aliases[root] = path;
                } else {
                    this.aliases[root] = {};
                    this.aliases[root][alias] = path;
                }
            } else if (_isString(this.aliases[root])) {
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
        } else if (_has(this.aliases, root)) {
            if (_isObject(this.aliases[root])) {
                delete this.aliases[root][alias];
            } else if (index === -1) {
                delete this.aliases[root];
            }
        }
    },

    /**
     * Creates a new instance using the given configuration.
     * @param {*} config Class name or object with param `className`
     * @returns {object}
     */
    createObject(config) {
        var className = null;
        var objectClass = null;

        // Normalize config
        if (_isFunction(config)) {
            objectClass = config;
            config = {};
        } else {
            if (_isString(config)) {
                className = config;
                config = {};
            } else if (_has(config, 'className')) {
                className = config.className;
                config = _clone(config);
                delete config.className;
            } else {
                throw new ApplicationException('Wrong configuration for create object.');
            }

            // Get class
            objectClass = this.namespace(className);
            if (!_isFunction(objectClass)) {
                throw new ApplicationException('Not found class `' + className + '` for create instance.');
            }
        }

        // Arguments for constructor of class
        var args = [objectClass];
        args = args.concat(_drop(arguments));
        if (!_isEmpty(config)) {
            args.push(config);
        }

        return new (objectClass.bind.apply(objectClass, args))();
    },

    /**
     * Set configuration to object. This method find public param in object or setter method.
     * You can not use setter and public param at the same time for safety reason
     * @param {Jii.base.Object} object Class instance
     * @param {object} config Configuration object {key: value, ..}
     */
    configure(object, config) {
        for (var key in config) {
            if (!config.hasOwnProperty(key)) {
                continue;
            }

            if (object instanceof Component) {
                object.set(key, config[key]);
                continue;
            }

            // Generate setter name
            var setter = 'set' + _upperFirst(key);

            if (!_isFunction(object[setter])) {
                if (_isFunction(object[key])) {
                    throw new InvalidConfigException('You can not replace from config function `' + key + '` in object `' + object.className() + '`.');
                }

                if (_isUndefined(object[key])) {
                    throw new InvalidConfigException('Config param `' + key + '` is undefined in object `' + object.className() + '`.');
                }
            }

            if (!_isUndefined(object[key]) && !_isFunction(object[key]) && _isFunction(object[setter])) {
                throw new InvalidConfigException('You have two setters (function and public param) for config param `' + key + '` in object `' + object.className() + '`.  Please change param access (to `_' + key + '`) or remove setter method.');
            }

            if (!_isUndefined(object[key]) && !_isFunction(object[key])) {
                if (Util.isStrictObject(object[key]) && Util.isStrictObject(config[key])) {
                    object[key] = Jii.mergeConfigs(object[key], config[key]);
                } else {
                    object[key] = config[key];
                }
            } else if (_isFunction(object[setter])) {
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
    trace(message, category) {
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
    error(message, category) {
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
    warning(message, category) {
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
    info(message, category) {
        category = category || '';

        console.info(message);
        // @todo static.getLogger().log(message, Logger.LEVEL_INFO, category);
    },

    /**
     * Short alias for translate texts
     * @param {string} category
     * @param {string} [message]
     * @param {object} [params]
     * @param {string|null} [language]
     * @returns {*}
     */
    t(category, message, params = {}, language = null) {
        if (this.app !== null && this.app.hasComponent('i18n')) {
            return this.app.getComponent('i18n').translate(category, message, params, language || this.app.language);
        }

        _each(params, (value, key) => {
            message = message.replace(new RegExp('\{' + key + '\}', 'gi'), value);
        });
        return message;
    },

    /**
     * @param {object...} [obj]
     * @returns {object}
     */
    mergeConfigs(obj) {
        var dst = {};

        for (var i = 0, l = arguments.length; i < l; ++i) {
            obj = arguments[i];
            if (!_isObject(obj)) {
                continue;
            }

            // Convert class name to object
            for (var key in obj) {
                if (obj.hasOwnProperty(key)) {
                    if (_isObject(obj[key]) && !_isArray(obj[key]) && !_isFunction(obj[key]) && !(obj instanceof BaseObject)) {
                        dst[key] = this.mergeConfigs(dst[key], obj[key]);
                    } else {
                        dst[key] = obj[key];
                    }
                }
            }
        }

        return dst;
    },

    catchHandler(e) {
        console.error(e.stack || e)
    }

});

/**
 * @module Jii
 */
module.exports = Jii;