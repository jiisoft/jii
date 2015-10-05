/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */

'use strict';

/**
 * @namespace Jii
 * @ignore
 */
var Jii = require('../Jii');

require('./Request');

/**
 * @class Jii.base.HttpRequest
 * @extends Jii.base.Request
 */
Jii.defineClass('Jii.base.HttpRequest', /** @lends Jii.base.HttpRequest.prototype */{

	__extends: Jii.base.Request,

	/**
	 *
	 * @returns {string}
	 */
	getMethod: function () {
		return 'GET';
	},

	/**
	 * Returns whether this is a GET request.
	 * @return {boolean}
	 */
	isGet: function () {
		return this.getMethod() === 'GET';
	},

	/**
	 * Returns whether this is a OPTIONS request.
	 * @return {boolean}
	 */
	isOptions: function () {
		return this.getMethod() === 'OPTIONS';
	},

	/**
	 * Returns whether this is a HEAD request.
	 * @return {boolean}
	 */
	isHead: function () {
		return this.getMethod() === 'HEAD';
	},

	/**
	 * Returns whether this is a POST request.
	 * @return {boolean}
	 */
	isPost: function () {
		return this.getMethod() === 'POST';
	},

	/**
	 * Returns whether this is a DELETE request.
	 * @return {boolean}
	 */
	isDelete: function () {
		return this.getMethod() === 'DELETE';
	},

	/**
	 * Returns whether this is a PUT request.
	 * @return {boolean}
	 */
	isPut: function () {
		return this.getMethod() === 'PUT';
	},

	/**
	 * Returns whether this is a PATCH request.
	 * @return {boolean}
	 */
	isPatch: function () {
		return this.getMethod() === 'PATCH';
	},

	/**
	 * Returns whether this is an AJAX (XMLHttpRequest) request.
	 * @return boolean whether this is an AJAX (XMLHttpRequest) request.
	 */
	isAjax: function () {
		return false;
	},

	/**
	 * Returns whether this is an Adobe Flash or Flex request.
	 * @return boolean whether this is an Adobe Flash or Adobe Flex request.
	 */
	isFlash: function () {
		return false;
	},

	/**
	 * Returns the named request body parameter value.
	 * @param {string} name the parameter name
	 * @param {*} [defaultValue] the default parameter value if the parameter does not exist.
	 * @return {*} the parameter value
	 */
	getBodyParam: function (name, defaultValue) {
		defaultValue = defaultValue || null;

		var bodyParams = this.getBodyParams();
		return Jii._.has(bodyParams, name) ? bodyParams[name] : defaultValue;
	},

	/**
	 * Returns POST parameter with a given name. If name isn't specified, returns an array of all POST parameters.
	 * @param {string} [name] the parameter name
	 * @param {*} [defaultValue] the default parameter value if the parameter does not exist.
	 * @return {*} The POST parameter value
	 */
	post: function (name, defaultValue) {
		name = name || null;
		defaultValue = defaultValue || null;

		return name === null ? this.getBodyParams() : this.getBodyParam(name, defaultValue);
	},

	_queryParams: null,

	/**
	 * Returns the request parameters given in the [[queryString]].
	 * @return {object} the request GET parameter values.
	 */
	getQueryParams: function () {
		if (this._queryParams === null) {
			this._queryParams = this._parseQueryParams();
		}
		return this._queryParams;
	},

	/**
	 * Sets the request [[queryString]] parameters.
	 * @param {object} values the request query parameters (name-value pairs)
	 */
	setQueryParams: function (values) {
		this._queryParams = values;
	},

	_parseQueryParams: function () {
	},

	/**
	 * Returns the named GET parameter value.
	 * @param {string} name the parameter name
	 * @param {*} [defaultValue] the default parameter value if the parameter does not exist.
	 * @return {*} the parameter value
	 */
	getQueryParam: function (name, defaultValue) {
		defaultValue = defaultValue || null;

		var queryParams = this.getQueryParams();
		return Jii._.has(queryParams, name) ? queryParams[name] : defaultValue;
	},

	/**
	 * Returns the named GET parameter value.
	 * If the GET parameter does not exist, the second parameter to this method will be returned.
	 * @param {string} [name] the GET parameter name. If not specified, whole all get params is returned.
	 * @param {*} [defaultValue] the default parameter value if the GET parameter does not exist.
	 * @return {*} the GET parameter value
	 */
	get: function (name, defaultValue) {
		name = name || null;
		defaultValue = defaultValue || null;

		return name === null ? this.getQueryParams() : this.getQueryParam(name, defaultValue);
	},

	_pathInfo: null,

	/**
	 * Returns the path info of the currently requested URL.
	 * A path info refers to the part that is after the entry script and before the question mark (query string).
	 * The starting and ending slashes are both removed.
	 * @return {string} Part of the request URL that is after the entry script and before the question mark.
	 * Note, the returned path info is already URL-decoded.
	 */
	getPathInfo: function () {
		if (this._pathInfo === null) {
			this._pathInfo = this._parsePathInfo();
		}
		return this._pathInfo;
	},

	/**
	 * Sets the path info of the current request.
	 * This method is mainly provided for testing purpose.
	 * @param {string} value The path info of the current request
	 */
	setPathInfo: function (value) {
		this._pathInfo = Jii._s.ltrim(value, '/');
	},

	_parsePathInfo: function () {
	},

	_hostInfo: null,

	/**
	 * Returns the schema and host part of the current request URL.
	 * The returned URL does not have an ending slash.
	 * By default this is determined based on the user request information.
	 * You may explicitly specify it by setting the setHostInfo().
	 * @return {string} Schema and hostname part (with port number if needed) of the request URL
	 */
	getHostInfo: function () {
		if (this._hostInfo === null) {
			this._hostInfo = this._parseHostInfo();
		}
		return this._hostInfo;
	},

	/**
	 * Sets the schema and host part of the application URL.
	 * This setter is provided in case the schema and hostname cannot be determined
	 * on certain Web servers.
	 * @param {string} value The schema and host part of the application URL. The trailing slashes will be removed.
	 */
	setHostInfo: function (value) {
		this._hostInfo = Jii._s.rtrim(value, '/');
		return this._hostInfo;
	},

	_parseHostInfo: function () {
	}

});

