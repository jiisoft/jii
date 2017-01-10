/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */

'use strict';

const Jii = require('../index');
const InvalidConfigException = require('../exceptions/InvalidConfigException');
const _trim = require('lodash/trim');
const _trimEnd = require('lodash/trimEnd');
const _trimStart = require('lodash/trimStart');
const _isArray = require('lodash/isArray');
const _indexOf = require('lodash/indexOf');
const _isEmpty = require('lodash/isEmpty');
const _isObject = require('lodash/isObject');
const _each = require('lodash/each');
const _has = require('lodash/has');
const _clone = require('lodash/clone');
const BaseObject = require('../base/BaseObject');

class UrlRule extends BaseObject {

    preInit(config) {
        /**
         * The regex for matching the route part. This is used in generating URL.
         * @type {string}
         */
        this._routeRule = null;

        /**
         * The template for generating a new URL. This is derived from [[pattern]] and is used in generating URL.
         * @type {string}
         */
        this._template = null;

        /**
         * A value indicating if this rule should be used for both request parsing and URL creation,
         * parsing only, or creation only.
         * If not set or 0, it means the rule is both request parsing and URL creation.
         * If it is [[PARSING_ONLY]], the rule is for request parsing only.
         * If it is [[CREATION_ONLY]], the rule is for URL creation only.
         * @type {number}
         */
        this.mode = null;

        /**
         * The HTTP verb (e.g. GET, POST, DELETE) that this rule should match.
         * Use array to represent multiple verbs that this rule may match.
         * If this property is not set, the rule can match any verb.
         * Note that this property is only used when parsing a request. It is ignored for URL creation.
         * @type {string|array}
         */
        this.verb = null;

        /**
         * The URL suffix used for this rule.
         * For example, ".html" can be used so that the URL looks like pointing to a static HTML page.
         * If not, the value of [[UrlManager::suffix]] will be used.
         * @type {string}
         */
        this.suffix = null;

        /**
         * The default GET parameters (name => value) that this rule provides.
         * When this rule is used to parse the incoming request, the values declared in this property
         * will be injected into $_GET.
         * @type {object}
         */
        this.defaults = {};

        /**
         * The route to the controller action
         * @type {string}
         */
        this.route = null;

        /**
         * The pattern used to parse and create the host info part of a URL.
         * @type {string}
         * @see pattern
         */
        this.host = null;

        /**
         * The pattern used to parse and create the path info part of a URL.
         * @type {string}
         * @see host
         */
        this.pattern = null;

        /**
         * The name of this rule. If not set, it will use [[pattern]] as the name.
         * @type {string}
         */
        this.name = null;

        /**
         * List of regex for matching parameters. This is used in generating URL.
         * @type {array}
         */
        this._paramRules = [];

        /**
         * List of parameters used in the route.
         * @type {object}
         */
        this._routeParams = {};

        super.preInit(...arguments);
    }

    init() {
        if (this.pattern === null) {
            throw new InvalidConfigException('UrlRule::pattern must be set.');
        }
        if (this.route === null) {
            throw new InvalidConfigException('UrlRule::route must be set.');
        }

        if (this.verb !== null) {
            if (!_isArray(this.verb)) {
                this.verb = [this.verb];
            }
            _each(this.verb, (value, key) => {
                this.verb[key] = value.toUpperCase();
            });
        }

        if (this.name === null) {
            this.name = this.pattern;
        }

        this.pattern = _trim(this.pattern, '/');

        if (this.host !== null) {
            this.pattern = _trimEnd(this.host, '/') + _trimEnd('/' + this.pattern, '/') + '/';
        } else if (this.pattern === '') {
            this._template = '';
            this.pattern = '^$';
            return;
        } else {
            this.pattern = '/' + this.pattern + '/';
        }

        this.route = _trim(this.route, '/');
        if (_indexOf(this.route, '<') !== -1) {
            var matches = this.route.match(/<(\w+)>/g) || [];
            _each(matches, name => {
                var key = name.substr(1, name.length - 2);
                this._routeParams[key] = name;
            });
        }

        var tr = {
            '.': '\\.',
            '*': '\\*',
            '$': '\\$',
            '[': '\\[',
            ']': '\\]',
            '(': '\\(',
            ')': '\\)'
        };
        var tr2 = {};
        var matches2 = this.pattern.match(/<(\w+):?([^>]+)?>/g) || [];
        _each(matches2, match => {
            match = match.substr(1, match.length - 2);

            var i = match.indexOf(':');
            var name = i !== -1 ? match.substr(0, i) : match;
            var pattern = i !== -1 ? match.substr(i + 1) : this.constructor.DEFAULT_PATTERN;

            if (_has(this.defaults, name)) {
                var length = match.length;
                var offset = this.pattern.indexOf(match);
                if (offset > 0 && this.pattern.substr(offset - 2, 1) === '/' && this.pattern.substr(offset + length + 1, 1) === '/') {
                    tr['/<' + name + '>'] = '(/(?P<' + name + '>' + pattern + '))?';
                } else {
                    tr['<' + name + '>'] = '((?P<' + name + '>' + pattern + '))?';
                }
            } else {
                tr['<' + name + '>'] = '((?P<' + name + '>' + pattern + '))';
            }

            if (_has(this._routeParams, name)) {
                tr2['<' + name + '>'] = '((?P<' + name + '>' + pattern + '))';
            } else {
                this._paramRules[name] = pattern === this.constructor.DEFAULT_PATTERN ? '' : '^' + pattern + '$';
            }
        });

        this._template = this.pattern.replace(/<(\w+):?([^>]+)?>/g, '<$1>');
        this.pattern = '^' + _trim(this._strtr(this._template, tr), '/') + '$';

        if (!_isEmpty(this._routeParams)) {
            this._routeRule = '^' + this._strtr(this.route, tr2) + '$';
        }
    }

    /**
     * Parses the given request and returns the corresponding route and parameters.
     * @param {UrlManager} manager the URL manager
     * @param {BaseRequest} request the request component
     * @return {[]|boolean} the parsing result. The route and the parameters are returned as an array.
     * If false, it means this rule cannot be used to parse this path info.
     */
    parseRequest(manager, request) {
        if (this.mode === UrlRule.CREATION_ONLY) {
            return false;
        }

        if (this.verb !== null && _indexOf(request.getMethod(), this.verb) === -1) {
            return false;
        }

        var pathInfo = request.getPathInfo();
        var suffix = this.suffix || manager.suffix;
        if (suffix && pathInfo) {
            var length = suffix.length;
            if (pathInfo.substr(-1 * length) === suffix) {
                pathInfo = pathInfo.substr(0, pathInfo.length - length);
                if (pathInfo === '') {
                    // suffix alone is not allowed
                    return false;
                }
            } else {
                return false;
            }
        }

        if (this.host !== null) {
            pathInfo = request.getHostInfo().toLowerCase() + '/' + pathInfo;
        }
        var matches = this._keyMatch(pathInfo, this.pattern, 'g');
        if (!matches || matches.length === 0) {
            return false;
        }

        if (_isObject(matches[0])) {
            // Skip first slash (added in pattern)
            _each(matches[0], (value, name) => {
                matches[0][name] = _trimStart(value, '/');
            });

            _each(this.defaults, (value, name) => {
                if (!_has(matches[0], name) || matches[0][name] === '') {
                    matches[0][name] = value;
                }
            });
        }

        var params = _clone(this.defaults);
        var tr = {};

        if (_isObject(matches[0])) {
            _each(matches[0], (value, name) => {
                if (_has(this._routeParams, name)) {
                    tr[this._routeParams[name]] = value;
                    delete params[name];
                } else if (_has(this._paramRules, name)) {
                    params[name] = value;
                }
            });
        }

        var route = this._routeRule !== null ? this._strtr(this.route, tr) : this.route;

        return [
            route,
            params
        ];
    }

    /**
     * Creates a URL according to the given route and parameters.
     * @param {UrlManager} manager the URL manager
     * @param {string} route the route. It should not have slashes at the beginning or the end.
     * @param {array} params the parameters
     * @return string|boolean the created URL, or false if this rule cannot be used for creating this URL.
     */
    createUrl(manager, route, params) {
        if (this.mode === UrlRule.PARSING_ONLY) {
            return false;
        }

        var tr = {};

        // match the route part first
        if (!(route === this.route || '/' + route === this.route)) {
            if (this._routeRule === null) {
                return false;
            }

            var matches = this._keyMatch(route, this._routeRule, 'g');
            if (!matches || matches.length === 0) {
                return false;
            }

            _each(this._routeParams, (token, name) => {
                tr[token] = !_has(this.defaults, name) || this.defaults[name] !== matches[0][name] ? matches[0][name] : '';
            });
        }

        // match default params
        // if a default param is not in the route pattern, its value must also be matched
        for (var name in this.defaults) {
            if (!this.defaults.hasOwnProperty(name) || _has(this._routeParams, name)) {
                continue;
            }

            var value = this.defaults[name];

            if (!_has(params, name)) {
                return false;
            } else if (params[name] === value) {
                delete params[name];
                if (_has(this._paramRules, name)) {
                    tr['<' + name + '>'] = '';
                }
            } else if (!_has(this._paramRules, name)) {
                return false;
            }
        }

        // match params in the pattern
        for (var ruleName in this._paramRules) {
            if (!this._paramRules.hasOwnProperty(ruleName)) {
                continue;
            }

            var rule = this._paramRules[ruleName];

            if (_has(params, ruleName) && !_isArray(params[ruleName]) && (rule === '' || new RegExp(rule).test(params[ruleName]))) {
                tr['<' + ruleName + '>'] = encodeURIComponent(params[ruleName]);
                delete params[ruleName];
            } else if (!_has(this.defaults, ruleName) || _has(params, ruleName)) {
                return false;
            }
        }

        var url = _trim(this._strtr(this._template, tr), '/');
        if (this.host !== null) {
            var index = url.indexOf('/', 8);
            if (index !== -1) {
                url = url.substr(0, index) + url.substr(index).replace(/\/+/g, '/');
            }
        } else if (url.indexOf('//') !== -1) {
            url = url.replace(/\/+/g, '/');
        }

        if (url !== '') {
            url += this.suffix || manager.suffix || '';
        }

        if (!_isEmpty(params)) {
            const UrlManager = require('./UrlManager');
            url += '?' + UrlManager.buildQuery(params);
        }
        return url;
    }

    _strtr(str, params) {
        _each(params, (to, from) => {
            from = from.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
            str = str.replace(new RegExp(from, 'g'), to);
        });
        return str;
    }

    /**
     * Javascript RegExp Match Named Captures
     * This script getted from http://trentrichardson.com/2011/08/02/javascript-regexp-match-named-captures/
     * @param {string} str
     * @param {string} re
     * @param {string} flags
     * @returns {array}
     * @private
     */
    _keyMatch(str, re, flags) {
        var isGlobal = false,
            results = [],
            keys = {},
            nativeRegExp = null,
            tmpstr = str;

        if (flags === undefined)
            flags = '';

        // find the keys inside the re, and place in mapping array {'1':'key1', '2':'key2', ...}
        var tmpkeys = re.match(/(?!\(\?P<)(\w+)(?=\>)/g);
        if (!tmpkeys) {
            // no keys, do a regular match
            return str.match(re);
        } else {
            for (var i = 0, l = tmpkeys.length; i < l; i++) {
                keys[i * 2 + 1] = tmpkeys[i];
            }
        }

        // remove keys from regexp leaving standard regexp
        nativeRegExp = re.replace(/\?P<\w+\>/g, '');

        if (flags.indexOf('g') >= 0)
            isGlobal = true;
        flags = flags.replace('g', '');

        nativeRegExp = new RegExp(nativeRegExp, flags);

        do {
            // parse string
            var tmpmatch = tmpstr.match(nativeRegExp),
                tmpkeymatch = {},
                tmpsubstr = '';

            if (tmpmatch) {
                // get the entire string found
                tmpsubstr = tmpmatch[0];

                tmpkeymatch[0] = tmpsubstr;

                // map them back out
                for (var i2 = 1, l2 = tmpmatch.length; i2 < l2; i2++) {
                    tmpkeymatch[keys[i2 - 1]] = tmpmatch[i2] || '';
                }

                // add to results
                results.push(tmpkeymatch);

                tmpstr = tmpstr.slice(tmpstr.indexOf(tmpsubstr) + tmpsubstr.length);
            } else {
                tmpstr = '';
            }
        } while (isGlobal && tmpstr.length > 0);
        // if global loop until end of str, else do once

        return results;
    }

}

/**
 * @type {string}
 */
UrlRule.DEFAULT_PATTERN = '[^/]+';

/**
 * Set [[mode]] with this value to mark that this rule is for URL creation only
 * @type {number}
 */
UrlRule.CREATION_ONLY = 2;

/**
 * Set [[mode]] with this value to mark that this rule is for URL parsing only
 * @type {number}
 */
UrlRule.PARSING_ONLY = 1;
module.exports = UrlRule;