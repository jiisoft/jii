/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */

'use strict';

var Jii = require('../Jii');
var HeaderCollection = require('../request/HeaderCollection');
var _trimStart = require('lodash/trimStart');
var _trimEnd = require('lodash/trimEnd');
var _each = require('lodash/each');
var _has = require('lodash/has');
var Request = require('./Request');

/**
 * @class Jii.base.HttpRequest
 * @extends Jii.base.Request
 */
module.exports = Jii.defineClass('Jii.base.HttpRequest', /** @lends Jii.base.HttpRequest.prototype */{

	__extends: Request,

    _pathInfo: null,

    _hostInfo: null,

    _serverPort: null,

    _port: null,

    /**
     * @type {Jii.request.HeaderCollection}
     */
    _headers: null,

	/**
	 *
	 * @returns {string}
	 */
	getMethod() {
		return 'GET';
	},

	/**
	 * Returns whether this is a GET request.
	 * @return {boolean}
	 */
	isGet() {
		return this.getMethod() === 'GET';
	},

	/**
	 * Returns whether this is a OPTIONS request.
	 * @return {boolean}
	 */
	isOptions() {
		return this.getMethod() === 'OPTIONS';
	},

	/**
	 * Returns whether this is a HEAD request.
	 * @return {boolean}
	 */
	isHead() {
		return this.getMethod() === 'HEAD';
	},

	/**
	 * Returns whether this is a POST request.
	 * @return {boolean}
	 */
	isPost() {
		return this.getMethod() === 'POST';
	},

	/**
	 * Returns whether this is a DELETE request.
	 * @return {boolean}
	 */
	isDelete() {
		return this.getMethod() === 'DELETE';
	},

	/**
	 * Returns whether this is a PUT request.
	 * @return {boolean}
	 */
	isPut() {
		return this.getMethod() === 'PUT';
	},

	/**
	 * Returns whether this is a PATCH request.
	 * @return {boolean}
	 */
	isPatch() {
		return this.getMethod() === 'PATCH';
	},

	/**
	 * Returns whether this is an AJAX (XMLHttpRequest) request.
	 * @return boolean whether this is an AJAX (XMLHttpRequest) request.
	 */
	isAjax() {
		return false;
	},

	/**
	 * Returns whether this is an Adobe Flash or Flex request.
	 * @return boolean whether this is an Adobe Flash or Adobe Flex request.
	 */
	isFlash() {
		return false;
	},

    /**
     * Returns the headers object.
     * @return {object}
     */
    getHeaders() {
        if (this._headers === null) {
            this._headers = new HeaderCollection();

            _each(this._parseHeaders(), (value, name) => {
                this._headers.add(name, value);
            });
        }
        return this._headers;
    },

    /**
     *
     * @param {object} values
     */
    setHeaders(values) {
        var headers = this.getHeaders();

        _each(values, (value, name) => {
            headers.add(name, value);
        });
    },

    /**
     * Returns the port to use for insecure requests.
     * Defaults to 80, or the port specified by the server if the current
     * request is insecure.
     * @return {number} Port number for insecure requests.
     * @see setPort()
     */
    getPort() {
        if (this._port === null) {
            var serverPort = this.getServerPort();
            this._port = !this.isSecureConnection() && serverPort ? serverPort : 80;
        }
        return this._port;
    },

    /**
     * Sets the port to use for insecure requests.
     * This setter is provided in case a custom port is necessary for certain
     * server configurations.
     * @param {number} value Port number.
     */
    setPort(value) {
        if (value != this._port) {
            this._port = parseInt(value);
            this._hostInfo = null;
        }
    },

    /**
     * Return if the request is sent via secure channel (https).
     * @return {boolean} If the request is sent via secure channel (https)
     */
    isSecureConnection() {
        // @todo
        return false;
    },

    /**
     * Returns the port to use for secure requests.
     * Defaults to 443, or the port specified by the server if the current
     * request is secure.
     * @return {number} Port number for secure requests.
     * @see setSecurePort()
     */
    getSecurePort() {
        if (this._securePort === null) {
            // @todo
            this._securePort = 443;
        }
        return this._securePort;
    },

    /**
     * Sets the port to use for secure requests.
     * This setter is provided in case a custom port is necessary for certain
     * server configurations.
     * @param {number} value port number.
     */
    setSecurePort(value) {
        if (value != this._port) {
            this._securePort = parseInt(value);
            this._hostInfo = null;
        }
    },

    /**
     * Returns the server port number.
     * @return {number} Server port number
     */
    getServerPort() {
        if (this._serverPort === null) {
            var port = this._httpMessage.headers.host.replace(/^[^:]+:/, '');
            this._serverPort = port ? parseInt(port) : 80;
        }
        return this._serverPort;
    },

	/**
	 * Returns the named request body parameter value.
	 * @param {string} name the parameter name
	 * @param {*} [defaultValue] the default parameter value if the parameter does not exist.
	 * @return {*} the parameter value
	 */
	getBodyParam(name, defaultValue) {
		defaultValue = defaultValue || null;

		var bodyParams = this.getBodyParams();
		return _has(bodyParams, name) ? bodyParams[name] : defaultValue;
	},

	/**
	 * Returns POST parameter with a given name. If name isn't specified, returns an array of all POST parameters.
	 * @param {string} [name] the parameter name
	 * @param {*} [defaultValue] the default parameter value if the parameter does not exist.
	 * @return {*} The POST parameter value
	 */
	post(name, defaultValue) {
		name = name || null;
		defaultValue = defaultValue || null;

		return name === null ? this.getBodyParams() : this.getBodyParam(name, defaultValue);
	},

	/**
	 * Returns the request parameters given in the [[queryString]].
	 * @return {object} the request GET parameter values.
	 */
	getQueryParams() {
        return this.getParams();
	},

	/**
	 * Sets the request [[queryString]] parameters.
	 * @param {object} values the request query parameters (name-value pairs)
	 */
	setQueryParams(values) {
		this.setParams(values);
	},

	/**
	 * Returns the named GET parameter value.
	 * @param {string} name the parameter name
	 * @param {*} [defaultValue] the default parameter value if the parameter does not exist.
	 * @return {*} the parameter value
	 */
	getQueryParam(name, defaultValue) {
		return this.getParam(name, defaultValue);
	},

	/**
	 * Returns the path info of the currently requested URL.
	 * A path info refers to the part that is after the entry script and before the question mark (query string).
	 * The starting and ending slashes are both removed.
	 * @return {string} Part of the request URL that is after the entry script and before the question mark.
	 * Note, the returned path info is already URL-decoded.
	 */
	getPathInfo() {
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
	setPathInfo(value) {
		this._pathInfo = _trimStart(value, '/');
	},

	/**
	 * Returns the schema and host part of the current request URL.
	 * The returned URL does not have an ending slash.
	 * By default this is determined based on the user request information.
	 * You may explicitly specify it by setting the setHostInfo().
	 * @return {string} Schema and hostname part (with port number if needed) of the request URL
	 */
	getHostInfo() {
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
	setHostInfo(value) {
		this._hostInfo = _trimEnd(value, '/');
		return this._hostInfo;
	},

    _parseHeaders() {
    },

    _parsePathInfo() {
    },

	_parseHostInfo() {
	}

});

