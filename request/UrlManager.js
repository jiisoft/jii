/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */

'use strict';

const Jii = require('../index');
const UrlRule = require('./UrlRule');
const Url = require('../helpers/Url');
const HttpRequest = require('../base/HttpRequest');
const _trimStart = require('lodash/trimStart');
const _isObject = require('lodash/isObject');
const _isEmpty = require('lodash/isEmpty');
const _isString = require('lodash/isString');
const _each = require('lodash/each');
const _has = require('lodash/has');
const Component = require('../base/Component');

class UrlManager extends Component {

    preInit() {
        this._hostInfo = null;
        this._baseUrl = null;

        /**
         * The default configuration of URL rules. Individual rule configurations
         * specified via [[rules]] will take precedence when the same property of the rule is configured.
         * @type {object}
         */
        this.ruleConfig = {
            className: UrlRule
        };

        /**
         * The cache object or the application component ID of the cache object.
         * Compiled URL rules will be cached through this cache object, if it is available.
         *
         * After the UrlManager object is created, if you want to change this property,
         * you should only assign it with a cache object.
         * Set this property to null if you do not want to cache the URL rules.
         * @type {Cache|string}
         */
        this.cache = 'cache';

        /**
         * The URL suffix used when in 'path' format.
         * For example, ".html" can be used so that the URL looks like pointing to a static HTML page.
         * @type {string}
         */
        this.suffix = null;

        /**
         * Each element in the array
         * is the configuration array for creating a single URL rule. The configuration will
         * be merged with [[ruleConfig]] first before it is used for creating the rule object.
         *
         * A special shortcut format can be used if a rule only specifies [[UrlRule::pattern|pattern]]
         * and [[UrlRule::route|route]]: `'pattern': 'route'`. That is, instead of using a configuration
         * array, one can use the key to represent the pattern and the value the corresponding route.
         * For example, `'post/<id:\d+>': 'post/view'`.
         *
         * For RESTful routing the mentioned shortcut format also allows you to specify the
         * [[UrlRule::verb|HTTP verb]] that the rule should apply for.
         * You can do that  by prepending it to the pattern, separated by space.
         * For example, `'PUT post/<id:\d+>': 'post/update'`.
         * You may specify multiple verbs by separating them with comma
         * like this: `'POST,PUT post/index': 'post/create'`.
         * The supported verbs in the shortcut format are: GET, HEAD, POST, PUT, PATCH and DELETE.
         * Note that [[UrlRule::mode|mode]] will be set to PARSING_ONLY when specifying verb in this way
         * so you normally would not specify a verb for normal GET request.
         *
         * Here is an example configuration for RESTful CRUD controller:
         *
         * ~~~
         * {
         *     'dashboard': 'site/index',
         *
         *     'POST <controller:\w+>s': '<controller>/create',
         *     <controller:\w+>s': '<controller>/index',
         *
         *     'PUT <controller:\w+>/<id:\d+>'   : '<controller>/update',
         *     'DELETE <controller:\w+>/<id:\d+>': '<controller>/delete',
         *     '<controller:\w+>/<id:\d+>'       : '<controller>/view'
         * }
         * ~~~
         *
         * Note that if you modify this property after the UrlManager object is created, make sure
         * you populate the array with rule objects instead of rule configurations.
         * @type {object}
         */
        this.rules = {};

        /**
         * Whether to enable strict parsing. If strict parsing is enabled, the incoming
         * requested URL must match at least one of the [[rules]] in order to be treated as a valid request.
         * Otherwise, the path info part of the request will be treated as the requested route.
         * @type {boolean}
         */
        this.enableStrictParsing = false;

        /**
         * Instance with request data
         * @type {Jii.request.BaseRequest}
         */
        this.request = null;

        super.preInit(...arguments);
    }

    static buildQuery(obj, tempKey) {
        var outputs = [];
        var cleanRegexp = /[!'()*]/g;

        _each(obj, (value, key) => {
            key = encodeURIComponent(key.replace(cleanRegexp, encodeURIComponent));
            if (tempKey) {
                key = tempKey + '[' + key + ']';
            }

            if (_isObject(value)) {
                outputs.push(this.constructor.buildQuery(value, key));
            } else {
                value = encodeURIComponent(value.toString().replace(cleanRegexp, encodeURIComponent));
                outputs.push(key + '=' + value);
            }
        });

        return outputs.join('&');
    }

    /**
     * Parses the URL rules.
     */
    _compileRules() {
        if (_isEmpty(this.rules)) {
            return;
        }

        if (_isString(this.cache)) {
        }
        // @todo Cache
        /*if (this.cache instanceof Cache) {
         key = __CLASS__;
         hash = md5(json_encode(this.rules));
         if ((data = this.cache.get(key)) !== false && isset(data[1]) && data[1] === hash) {
         this.rules = data[0];
         return;
         }
         }*/

        var rules = [];
        var verbRegexp = /^((?:(GET|HEAD|POST|PUT|PATCH|DELETE),)*(GET|HEAD|POST|PUT|PATCH|DELETE))\s+(.*)/;
        _each(this.rules, (rule, key) => {
            if (!_isObject(rule)) {
                rule = {
                    route: rule
                };

                var matches = verbRegexp.exec(key);
                if (matches !== null) {
                    //    TODO: Here something happening. Need document.
                    rule.verb = matches[1].split(',');
                    rule.mode = UrlRule.PARSING_ONLY;
                    key = matches[4];
                }
                rule.pattern = key;
            }

            var ruleConfig = Jii.mergeConfigs(this.ruleConfig, rule);
            rules.push(Jii.createObject(ruleConfig));
        });
        this.rules = rules;
        // @todo Cache
        /*if (isset(key, hash)) {
         this.cache.set(key, [this.rules, hash]);
         }*/
    }

    /**
     * Parses the user request.
     * @param {Jii.request.BaseRequest} request the request component
     * @return {array|boolean} the route and the associated parameters. The latter is always empty
     */
    parseRequest(request) {
        var result = false;

        /**
         * @type {Jii.request.UrlRule} rule
         */
        _each(this.rules, rule => {
            if (result === false) {
                result = rule.parseRequest(this, request);
            }
        });

        if (result !== false) {
            return result;
        }

        if (this.enableStrictParsing) {
            return false;
        }

        //Yii::trace('No matching URL rules. Using default URL parsing logic.', __METHOD__);

        var pathInfo = request.getPathInfo();
        if (this.suffix !== null && pathInfo !== '') {
            var n = this.suffix.length;
            if (pathInfo.substr(-1 * n) === this.suffix) {
                pathInfo = pathInfo.substr(0, pathInfo.length - n);
                if (pathInfo === '') {
                    // suffix alone is not allowed
                    return false;
                }
            } else {
                // suffix doesn't match
                return false;
            }
        }

        return [
            pathInfo,
            []
        ];
    }

    /**
     * Creates a URL using the given route and parameters.
     * The URL created is a relative one. Use [[createAbsoluteUrl()]] to create an absolute URL.
     * @param {string|array|object} route the route
     * @param {Jii.base.Context} [context]
     * @return {string} the created URL
     */
    createUrl(route, context) {
        var parts = Url.parseRoute(route, context);
        var params = parts.params;
        route = parts.route;

        var anchor = _has(params, '#') ? '#'.params['#'] : '';
        delete params['#'];

        var baseUrl = context && context.request instanceof HttpRequest ? context.request.getBaseUrl() : '';

        var url = false;
        /** @type {Jii.request.UrlRule} rule */
        _each(this.rules, rule => {
            if (url !== false) {
                return;
            }

            url = rule.createUrl(this, route, params);
            if (url === false) {
                return;
            }

            if (rule.host !== null) {
                var index = url.indexOf('/', 8);
                if (baseUrl !== '' && index !== -1) {
                    url = url.substr(0, index) + baseUrl + url.substr(index);
                } else {
                    url = url + baseUrl + anchor;
                }
            } else {
                url = baseUrl + url + anchor;
            }
            return false;
        });
        if (url !== false) {
            return url;
        }

        if (this.suffix !== null) {
            route += this.suffix;
        }
        if (!_isEmpty(params)) {
            route += '?' + this.constructor.buildQuery(params);
        }
        return baseUrl + route + anchor;
    }

    /**
     * Creates an absolute URL using the given route and parameters.
     * This method prepends the URL created by [[createUrl()]] with the [[hostInfo]].
     * @param {string|array|object} route the route
     * @param {Jii.base.Context} [context]
     * @param {boolean|string} [scheme]
     * @return {string} the created URL
     * @see createUrl()
     */
    createAbsoluteUrl(route, context, scheme) {
        var url = this.createUrl(route, context);
        if (url.indexOf('://') === -1 && context && context.request instanceof HttpRequest) {
            url = context.request.getHostInfo() + url;
        } else {
            url = '/' + _trimStart(url, '/');
        }

        if (_isString(scheme)) {
        }

        return url;
    }

    /**
     * set rules
     * @param {array} rules
     */
    setRules(rules){
        this.rules = rules;
        this._compileRules();
    }
}
module.exports = UrlManager;