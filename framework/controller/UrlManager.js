/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */

'use strict';

/**
 * UrlManager handles HTTP request parsing and creation of URLs based on a set of rules.
 *
 * UrlManager is configured as an application component in [[jii.base.Application]] by default.
 * You can access that instance via `Jii.app.urlManager`.
 *
 * You can modify its configuration by adding an array to your application config under `components`
 * as it is shown in the following example:
 *
 * ~~~
 * 'urlManager': {
 *     rules: {
 *         // your rules go here
 *     },
 *     // ...
 * }
 * ~~~
 *
 * @class Jii.controller.UrlManager
 * @extends Jii.base.Component
 */
Jii.defineClass('Jii.controller.UrlManager', {

	__extends: Jii.base.Component,

	__static: {
		buildQuery: function (obj, tempKey) {
			var outputs = [];
			var cleanRegexp = /[!'()*]/g;

			_.each(obj, function (value, key) {
				key = encodeURIComponent(key.replace(cleanRegexp, encodeURIComponent));
				if (tempKey) {
					key = tempKey + '[' + key + ']';
				}

				if (_.isObject(value)) {
					outputs.push(this.__static.buildQuery(value, key));
				} else {
					value = encodeURIComponent(value.toString().replace(cleanRegexp, encodeURIComponent));
					outputs.push(key + '=' + value);
				}
			});

			return outputs.join('&');
		}
	},
	/**
	 * Instance with request data
	 * @type {Jii.controller.BaseRequest}
	 */
	request: null,

	/**
	 * Whether to enable strict parsing. If strict parsing is enabled, the incoming
	 * requested URL must match at least one of the [[rules]] in order to be treated as a valid request.
	 * Otherwise, the path info part of the request will be treated as the requested route.
	 * @type {boolean}
	 */
	enableStrictParsing: false,

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
	rules: [],

	/**
	 * The URL suffix used when in 'path' format.
	 * For example, ".html" can be used so that the URL looks like pointing to a static HTML page.
	 * @type {string}
	 */
	suffix: null,

	/**
	 * The cache object or the application component ID of the cache object.
	 * Compiled URL rules will be cached through this cache object, if it is available.
	 *
	 * After the UrlManager object is created, if you want to change this property,
	 * you should only assign it with a cache object.
	 * Set this property to null if you do not want to cache the URL rules.
	 * @type {Cache|string}
	 */
	cache: 'cache',

	/**
	 * The default configuration of URL rules. Individual rule configurations
	 * specified via [[rules]] will take precedence when the same property of the rule is configured.
	 * @type {object}
	 */
	ruleConfig: {
		className: 'Jii.controller.UrlRule'
	},

	_baseUrl: null,
	_hostInfo: null,

	/**
	 * Initializes UrlManager.
	 */
	init: function () {
		this.__super();
		this._compileRules();
	},

	/**
	 * Parses the URL rules.
	 */
	_compileRules: function () {
		if (_.isEmpty(this.rules)) {
			return;
		}

		if (_.isString(this.cache)) {
			//this.cache = Jii.app.getComponent(this.cache);
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
		_.each(this.rules, _.bind(function (rule, key) {
			if (!_.isObject(rule)) {
				rule = {route: rule};

				var matches = verbRegexp.exec(key);
				if (matches !== null) {
					//	TODO: Here something happening. Need document.
					rule.verb = matches[1].split(',');
					rule.mode = Jii.controller.UrlRule.PARSING_ONLY;
					key = matches[4];
				}
				rule.pattern = key;
			}

			var ruleConfig = _.merge({}, this.ruleConfig, rule);
			rules.push(Jii.createObject(ruleConfig));
		}, this));
		this.rules = rules;

		// @todo Cache
		/*if (isset(key, hash)) {
		 this.cache.set(key, [this.rules, hash]);
		 }*/
	},

	/**
	 * Parses the user request.
	 * @param {Jii.controller.BaseRequest} request the request component
	 * @return {array|boolean} the route and the associated parameters. The latter is always empty
	 */
	parseRequest: function (request) {
		var result = false;

		/**
		 * @type {Jii.controller.UrlRule} rule
		 */
		_.each(this.rules, _.bind(function (rule) {
			result = rule.parseRequest(this, request);
			if (result !== false) {
				//Yii::trace("Request parsed with URL rule: {rule.name}", __METHOD__);
				return false;
			}
		}, this));
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

		return [pathInfo, []];
	},

	/**
	 * Creates a URL using the given route and parameters.
	 * The URL created is a relative one. Use [[createAbsoluteUrl()]] to create an absolute URL.
	 * @param {string} route the route
	 * @param {array} params the parameters (name-value pairs)
	 * @return {string} the created URL
	 */
	createUrl: function (route, params) {
		params = params || {};

		var anchor = _.has(params, '#') ? '#'.params['#'] : '';
		delete params['#'];

		route = _.string.trim(route, '/');
		var baseUrl = this.getBaseUrl();

		var url = false;
		/** @type {Jii.controller.UrlRule} rule */
		_.each(this.rules, _.bind(function (rule) {
			url = rule.createUrl(this, route, params);
			if (url === false) {
				return null;
			}

			if (rule.host !== null) {
				var index = url.indexOf('/', 8);
				if (baseUrl !== '' && index !== -1) {
					url = url.substr(0, index) + baseUrl + url.substr(index);
				} else {
					url = url + baseUrl + anchor;
				}
			} else {
				url = baseUrl + '/' + url + anchor;
			}
			return false;
		}, this));
		if (url !== false) {
			return url;
		}

		if (this.suffix !== null) {
			route += this.suffix;
		}
		if (!_.isEmpty(params)) {
			route += '?' + this.__static.buildQuery(params);
		}
		return baseUrl + '/' + url + anchor;
	},

	/**
	 * Creates an absolute URL using the given route and parameters.
	 * This method prepends the URL created by [[createUrl()]] with the [[hostInfo]].
	 * @param {string} route the route
	 * @param {array} params the parameters (name-value pairs)
	 * @return {string} the created URL
	 * @see createUrl()
	 */
	createAbsoluteUrl: function (route, params) {
		params = params || {};

		var url = this.createUrl(route, params);
		if (url.indexOf('://') !== -1) {
			return url;
		}

		return this.getHostInfo() + url;
	},

	/**
	 * Returns the base URL that is used by [[createUrl()]] to prepend URLs it creates.
	 * otherwise, it defaults to [[Request::baseUrl]].
	 * @return {string} the base URL that is used by [[createUrl()]] to prepend URLs it creates.
	 */
	getBaseUrl: function () {
		if (this._baseUrl === null) {
			this._baseUrl = this.request ? this.request.getBaseUrl() : '';
		}
		return this._baseUrl;
	},

	/**
	 * Sets the base URL that is used by [[createUrl()]] to prepend URLs it creates.
	 * @param {string} value the base URL that is used by [[createUrl()]] to prepend URLs it creates.
	 */
	setBaseUrl: function (value) {
		this._baseUrl = _.string.rtrim(value, '/');
	},

	/**
	 * Returns the host info that is used by [[createAbsoluteUrl()]] to prepend URLs it creates.
	 * @return string the host info (e.g. "http://www.example.com") that is used by [[createAbsoluteUrl()]] to prepend URLs it creates.
	 */
	getHostInfo: function () {
		if (this._hostInfo === null) {
			this._hostInfo = this.request ? this.request.getHostInfo() : '';
		}
		return this._hostInfo;
	},

	/**
	 * Sets the host info that is used by [[createAbsoluteUrl()]] to prepend URLs it creates.
	 * @param {string} value the host info (e.g. "http://www.example.com") that is used by [[createAbsoluteUrl()]] to prepend URLs it creates.
	 */
	setHostInfo: function (value) {
		this._hostInfo = _.string.rtrim(value, '/');
	}

});
