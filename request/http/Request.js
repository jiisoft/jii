/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */
'use strict';

var Jii = require('../../index');
var InvalidConfigException = require('../../exceptions/InvalidConfigException');
var _trimStart = require('lodash/trimStart');
var _isEmpty = require('lodash/isEmpty');
var _each = require('lodash/each');
var _values = require('lodash/values');
var HttpRequest = require('../../base/HttpRequest');
class Request extends HttpRequest {

    preInit(httpMessage) {
        this._referrer = null;
        this._languages = null;
        this._contentTypes = null;
        this._securePort = null;
        this._serverName = null;
        this._cookies = null;
        this._url = null;
        this._baseUrl = null;
        this._queryString = null;
        this._bodyParams = null;

        if (!httpMessage.method) {
            throw new InvalidConfigException('Not found param `method` in http message.');
        }
        if (!httpMessage.headers) {
            throw new InvalidConfigException('Not found `headers` in http message.');
        }
        this._httpMessage = httpMessage;

        super.preInit();
    }

    /**
     * Returns the method of the current request (e.g. GET, POST, HEAD, PUT, PATCH, DELETE).
     * @return {string}
     */
    getMethod() {
        return this._httpMessage.method;
    }

    /**
     * Returns whether this is an AJAX (XMLHttpRequest) request.
     * @return boolean whether this is an AJAX (XMLHttpRequest) request.
     */
    isAjax() {
        var xhr = this._httpMessage.headers['X-Requested-With'] || '';
        return xhr.toLowerCase() === 'xmlhttprequest';
    }

    /**
     * Returns whether this is an Adobe Flash or Flex request.
     * @return boolean whether this is an Adobe Flash or Adobe Flex request.
     */
    isFlash() {
        var userAgent = this._httpMessage.headers['user-agent'] || '';
        return userAgent && (userAgent.indexOf('Shockwave') !== -1 || userAgent.indexOf('Flash') !== -1);
    }

    /**
     * Returns the request parameters given in the request body.
     *
     * Request parameters are determined using the parsers configured in [[parsers]] property.
     * @return {object} the request parameters given in the request body.
     */
    getBodyParams() {
        if (this._bodyParams === null) {
            // @todo Change this code, when delete express
            this._bodyParams = this._httpMessage.body || {};
        }
        return this._bodyParams;
    }

    /**
     * Sets the request body parameters.
     * @param {object} values the request body parameters (name-value pairs)
     */
    setBodyParams(values) {
        this._bodyParams = values;
    }

    /**
     * Returns the relative URL for the application.
     * This is similar to [[scriptUrl]] except that it does not include the script file name,
     * and the ending slashes are removed.
     * @return {string} The relative URL for the application
     */
    getBaseUrl() {
        return this._baseUrl || '/';
    }

    /**
     * Sets the relative URL for the application.
     * By default the URL is determined based on the entry script URL.
     * This setter is provided in case you want to change this behavior.
     * @param {string} value The relative URL for the application
     */
    setBaseUrl(value) {
        this._baseUrl = value;
    }

    /**
     * Returns the currently requested absolute URL.
     * This is a shortcut to the concatenation of [[hostInfo]] and [[url]].
     * @return {string} The currently requested absolute URL.
     */
    getAbsoluteUrl() {
        return this.getHostInfo() + this.getUrl();
    }

    /**
     * Returns the currently requested relative URL.
     * This refers to the portion of the URL that is after the [[hostInfo]] part.
     * It includes the [[queryString]] part if any.
     * @return {string} The currently requested relative URL. Note that the URI returned is URL-encoded.
     */
    getUrl() {
        if (this._url === null) {
            this._url = this._httpMessage.url;
        }
        return this._url;
    }

    /**
     * Sets the currently requested relative URL.
     * The URI must refer to the portion that is after [[hostInfo]].
     * Note that the URI should be URL-encoded.
     * @param {string} value The request URI to be set
     */
    setUrl(value) {
        this._url = _trimStart(value, '/');
    }

    /**
     * Returns part of the request URL that is after the question mark.
     * @return {string} Part of the request URL that is after the question mark
     */
    getQueryString() {
        if (this._queryString === null) {
            this._queryString = this._httpMessage._parsedUrl.query;
        }
        return this._queryString;
    }

    /**
     * Returns the server name.
     * @return {string} Server name
     */
    getServerName() {
        if (this._serverName === null) {
            this._serverName = this._httpMessage.headers.host.replace(/:[0-9]+$/, '');
        }
        return this._serverName;
    }

    /**
     * Returns the URL referrer, null if not present
     * @return string URL referrer, null if not present
     */
    getReferrer() {
        if (this._referrer === null) {
            var headers = this.getHeaders();
            this._referrer = headers.get('referrer') || headers.get('referer') || null;
        }
        return this._referrer;
    }

    /**
     * Returns the user agent, null if not present.
     * @return string user agent, null if not present
     */
    getUserAgent() {
        return this._httpMessage.headers['user-agent'];
    }

    /**
     * Returns the user IP address.
     * @return string user IP address
     */
    getUserIP() {
        return this._httpMessage.headers['x-real-ip'] || this._httpMessage.remoteAddress || null;
    }

    /**
     * Returns the user host name, null if it cannot be determined.
     * @return string user host name, null if cannot be determined
     */
    getUserHost() {
        // @todo
        return this.getUserIP();
    }

    getContentType() {
        // @todo
        return null;
    }

    /**
     * Returns the content types accepted by the end user.
     * This is determined by the `Accept` HTTP header.
     * @return {array} The content types ordered by the preference level. The first element
     * represents the most preferred content type.
     */
    getAcceptableContentTypes() {
        if (this._contentTypes === null) {
            var acceptHeader = this._httpMessage.headers.accept;
            this._contentTypes = acceptHeader ? this._parseAcceptHeader(acceptHeader) : [];
        }
        return this._contentTypes;
    }

    /**
     * @param {array} value The content types that are accepted by the end user. They should
     * be ordered by the preference level.
     */
    setAcceptableContentTypes(value) {
        this._contentTypes = value;
    }

    /**
     * Returns the languages accepted by the end user.
     * This is determined by the `Accept-Language` HTTP header.
     * @return {array} The languages ordered by the preference level. The first element
     * represents the most preferred language.
     */
    getAcceptableLanguages() {
        if (this._languages === null) {
            if (this._httpMessage.accept) {
                this._languages = this._parseAcceptHeader(this._httpMessage.accept);
            }
            this._languages = [];
        }
        return this._languages;
    }

    /**
     * @param {array} value The languages that are accepted by the end user. They should
     * be ordered by the preference level.
     */
    setAcceptableLanguages(value) {
        this._languages = value;
    }

    /**
     * Returns the user-preferred language that should be used by this application.
     * The language resolution is based on the user preferred languages and the languages
     * supported by the application. The method will try to find the best match.
     * @param {object} languages A list of the languages supported by the application.
     * If empty, this method will return the first language returned by [[getAcceptableLanguages()]].
     * @return {string} The language that the application should use. Null is returned if both [[getAcceptableLanguages()]]
     * and `languages` are empty.
     */
    getPreferredLanguage(languages) {
        var acceptedLanguages = this.getAcceptableLanguages();
        var finedLanguage = null;

        if (_isEmpty(languages)) {
            return acceptedLanguages.length > 0 ? acceptedLanguages[0] : null;
        }

        _each(acceptedLanguages, acceptedLanguage => {
            acceptedLanguage = acceptedLanguage.replace('_', '-').toLowerCase();
            _each(languages, language => {
                language = language.replace('_', '-').toLowerCase();

                // en-us==en-us, en==en-us, en-us==en
                if (language === acceptedLanguage || acceptedLanguage.indexOf(language + '-') === 0 || language.indexOf(acceptedLanguage + '-') === 0) {
                    finedLanguage = language;
                    return false;
                }
            });
        });

        return finedLanguage || _values(languages)[0];
    }

    getCookies() {

        if (this._cookies === null) {
            this._cookies = this._httpMessage.cookies || {};
        }
        return this._cookies;
    }

    _parseParams() {
        // @todo Change this code, when delete express
        return this._httpMessage.query;
    }

    /**
     * Parses the given `Accept` (or `Accept-Language`) header.
     * This method will return the accepted values ordered by their preference level.
     * @param {string} header The header to be parsed
     * @return {array} The accept values ordered by their preference level.
     */
    _parseAcceptHeader(header) {}

    _parseHeaders() {
        return this._httpMessage.headers;
    }

    _parseHostInfo() {
        var http = this.isSecureConnection() ? 'https' : 'http';
        return http + '://' + this._httpMessage.headers.host;
    }

    _parsePathInfo() {
        return _trimStart(this._httpMessage._parsedUrl.pathname, '/');
    }

}
module.exports = Request;