/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */

'use strict';

/**
 * @class Jii.controller.httpServer.Request
 * @extends Jii.controller.BaseHttpRequest
 */
Jii.defineClass('Jii.controller.httpServer.Request', {

	__extends: Jii.controller.BaseHttpRequest,

    _httpMessage: null,

    constructor: function(httpMessage) {
        if (!httpMessage.method) {
            throw new Jii.exceptions.InvalidConfigException('Not found param `method` in http message.');
        }
        if (!httpMessage.headers) {
            throw new Jii.exceptions.InvalidConfigException('Not found `headers` in http message.');
        }

        this._httpMessage = httpMessage;

        this.init();
    },

	/**
	 * @type {Jii.controller.HeaderCollection}
	 */
	_headers: null,

    /**
     * Returns the headers object.
     * @return {object}
     */
    getHeaders: function() {
		if (this._headers === null) {
			this._headers = new Jii.controller.HeaderCollection();

			_.each(this._httpMessage.headers, _.bind(function(value, name) {
				this._headers.add(name, value);
			}, this));
		}
        return this._headers;
    },

    /**
     * Returns the method of the current request (e.g. GET, POST, HEAD, PUT, PATCH, DELETE).
     * @return {string}
     */
    getMethod: function() {
        return this._httpMessage.method;
    },

    /**
     * Returns whether this is an AJAX (XMLHttpRequest) request.
     * @return boolean whether this is an AJAX (XMLHttpRequest) request.
     */
    isAjax: function() {
        var xhr = this._httpMessage.headers['X-Requested-With'] || '';
        return xhr.toLowerCase() === 'xmlhttprequest';
    },

    /**
     * Returns whether this is an Adobe Flash or Flex request.
     * @return boolean whether this is an Adobe Flash or Adobe Flex request.
     */
    isFlash: function() {
        var userAgent = this._httpMessage.headers['user-agent'] || '';
        return userAgent && (userAgent.indexOf('Shockwave') !== -1 ||userAgent.indexOf('Flash') !== -1);
    },

    _bodyParams: null,

    /**
     * Returns the request parameters given in the request body.
     *
     * Request parameters are determined using the parsers configured in [[parsers]] property.
     * @return {object} the request parameters given in the request body.
     */
    getBodyParams: function() {
        if (this._bodyParams === null) {
            // @todo Change this code, when delete express
            this._bodyParams = this._httpMessage.body;
        }
        return this._bodyParams;
    },

    /**
     * Sets the request body parameters.
     * @param {object} values the request body parameters (name-value pairs)
     */
    setBodyParams: function(values) {
        this._bodyParams = values;
    },

    _parseQueryParams: function() {
        // @todo Change this code, when delete express
        return this._httpMessage.query;
    },

    _baseUrl: null,

    /**
     * Returns the relative URL for the application.
     * This is similar to [[scriptUrl]] except that it does not include the script file name,
     * and the ending slashes are removed.
     * @return {string} The relative URL for the application
     */
    getBaseUrl: function() {
		return this._baseUrl || '/'; // @todo Is true for node js?
    },

    /**
     * Sets the relative URL for the application.
     * By default the URL is determined based on the entry script URL.
     * This setter is provided in case you want to change this behavior.
     * @param {string} value The relative URL for the application
     */
    setBaseUrl: function(value) {
        this._baseUrl = value;
    },

    _parseHostInfo: function() {
        var http = this.isSecureConnection() ? 'https' : 'http';
        return http + '://' + this._httpMessage.headers.host;
    },

    _parsePathInfo: function() {
        return _.string.ltrim(this._httpMessage._parsedUrl.pathname, '/');
    },

    /**
     * Returns the currently requested absolute URL.
     * This is a shortcut to the concatenation of [[hostInfo]] and [[url]].
     * @return {string} The currently requested absolute URL.
     */
    getAbsoluteUrl: function() {
        return this.getHostInfo() + this.getUrl();
    },

    _url: null,

    /**
     * Returns the currently requested relative URL.
     * This refers to the portion of the URL that is after the [[hostInfo]] part.
     * It includes the [[queryString]] part if any.
     * @return {string} The currently requested relative URL. Note that the URI returned is URL-encoded.
     */
    getUrl: function() {
        if (this._url === null) {
            this._url = this._httpMessage.url;
        }
        return this._url;
    },

    /**
     * Sets the currently requested relative URL.
     * The URI must refer to the portion that is after [[hostInfo]].
     * Note that the URI should be URL-encoded.
     * @param {string} value The request URI to be set
     */
    setUrl: function(value) {
        this._url = _.string.ltrim(value, '/');
    },

    _queryString: null,

    /**
     * Returns part of the request URL that is after the question mark.
     * @return {string} Part of the request URL that is after the question mark
     */
    getQueryString: function() {
        if (this._queryString === null) {
            this._queryString = this._httpMessage._parsedUrl.query;
        }
        return this._queryString;
    },

    /**
     * Return if the request is sent via secure channel (https).
     * @return {boolean} If the request is sent via secure channel (https)
     */
    isSecureConnection: function() {
        // @todo
    },

    _serverName: null,

    /**
     * Returns the server name.
     * @return {string} Server name
     */
    getServerName: function() {
        if (this._serverName === null) {
            this._serverName = this._httpMessage.headers.host.replace(/:[0-9]+$/, '');
        }
        return this._serverName;
    },

    _serverPort: null,

    /**
     * Returns the server port number.
     * @return {number} Server port number
     */
    getServerPort: function() {
        if (this._serverPort === null) {
            var port = this._httpMessage.headers.host.replace(/^[^:]+:/, '');
            this._serverPort = port ? parseInt(port) : 80;
        }
        return this._serverPort;
    },

    _referrer: null,

    /**
     * Returns the URL referrer, null if not present
     * @return string URL referrer, null if not present
     */
    getReferrer: function() {
        if (this._referrer === null) {
            var headers = this.getHeaders();
            this._referrer = headers.get('referrer') || headers.get('referer') || null;
        }
        return this._referrer;
    },

    /**
     * Returns the user agent, null if not present.
     * @return string user agent, null if not present
     */
    getUserAgent: function() {
        return this._httpMessage.headers['user-agent'];
    },

    /**
     * Returns the user IP address.
     * @return string user IP address
     */
    getUserIP: function() {
        return this._httpMessage.headers['x-real-ip'] || this._httpMessage.remoteAddress || null;
    },

    /**
     * Returns the user host name, null if it cannot be determined.
     * @return string user host name, null if cannot be determined
     */
    getUserHost: function() {
        // @todo
        return this.getUserIP();
    },

    _port: null,

    /**
     * Returns the port to use for insecure requests.
     * Defaults to 80, or the port specified by the server if the current
     * request is insecure.
     * @return {number} Port number for insecure requests.
     * @see setPort()
     */
    getPort: function() {
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
    setPort: function(value) {
        if (value != this._port) {
            this._port = parseInt(value);
            this._hostInfo = null;
        }
    },

    _securePort: null,

    /**
     * Returns the port to use for secure requests.
     * Defaults to 443, or the port specified by the server if the current
     * request is secure.
     * @return {number} Port number for secure requests.
     * @see setSecurePort()
     */
    getSecurePort: function() {
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
    setSecurePort: function(value) {
        if (value != this._port) {
            this._securePort = parseInt(value);
            this._hostInfo = null;
        }
    },

    getContentType: function() {
        // @todo
        return null;
    },

    _contentTypes: null,

    /**
     * Returns the content types accepted by the end user.
     * This is determined by the `Accept` HTTP header.
     * @return {array} The content types ordered by the preference level. The first element
     * represents the most preferred content type.
     */
    getAcceptableContentTypes: function() {
        if (this._contentTypes === null) {
            var acceptHeader = this._httpMessage.headers.accept;
            this._contentTypes = acceptHeader ? this._parseAcceptHeader(acceptHeader) : [];
        }
        return this._contentTypes;
    },

    /**
     * @param {array} value The content types that are accepted by the end user. They should
     * be ordered by the preference level.
     */
    setAcceptableContentTypes: function(value) {
        this._contentTypes = value;
    },

    _languages: null,

    /**
     * Returns the languages accepted by the end user.
     * This is determined by the `Accept-Language` HTTP header.
     * @return {array} The languages ordered by the preference level. The first element
     * represents the most preferred language.
     */
    getAcceptableLanguages: function() {
        if (this._languages === null) {
            if (this._httpMessage.accept) {
                this._languages = this._parseAcceptHeader(this._httpMessage.accept);
            }
            this._languages = [];
        }
        return this._languages;
    },

    /**
     * @param {array} value The languages that are accepted by the end user. They should
     * be ordered by the preference level.
     */
    setAcceptableLanguages: function(value) {
        this._languages = value;
    },

    /**
     * Parses the given `Accept` (or `Accept-Language`) header.
     * This method will return the accepted values ordered by their preference level.
     * @param {string} header The header to be parsed
     * @return {array} The accept values ordered by their preference level.
     */
    _parseAcceptHeader: function(header) {
        // @todo
    },

    /**
     * Returns the user-preferred language that should be used by this application.
     * The language resolution is based on the user preferred languages and the languages
     * supported by the application. The method will try to find the best match.
     * @param {object} languages A list of the languages supported by the application.
     * If empty, this method will return the first language returned by [[getAcceptableLanguages()]].
     * @return {string} The language that the application should use. Null is returned if both [[getAcceptableLanguages()]]
     * and `languages` are empty.
     */
    getPreferredLanguage: function(languages) {
        var acceptedLanguages = this.getAcceptableLanguages();
        var finedLanguage = null;

        if (_.isEmpty(languages)) {
            return acceptedLanguages.length > 0 ? acceptedLanguages[0] : null;
        }

        _.each(acceptedLanguages, function(acceptedLanguage) {
            acceptedLanguage = acceptedLanguage.replace('_', '-').toLowerCase();
            _.each(languages, function(language) {
                language = language.replace('_', '-').toLowerCase();

                // en-us==en-us, en==en-us, en-us==en
                if (language === acceptedLanguage || acceptedLanguage.indexOf(language + '-') === 0 || language.indexOf(acceptedLanguage + '-') === 0) {
                    finedLanguage = language;
                    return false;
                }
            });
        });

        return finedLanguage || _.values(languages)[0];
    },

    _cookies: null,

    getCookies: function() {

        if (this._cookies === null) {
            this._cookies = this._httpMessage.cookies || {};
        }
        return this._cookies;
    }

});
