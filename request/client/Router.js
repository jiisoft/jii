/**
 *
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

var Jii = require('../../BaseJii');
var Request = require('./Request');
var Response = require('./Response');
var _isString = require('lodash/isString');
var _extend = require('lodash/extend');
var Component = require('../../base/Component');

/**
 * @class Jii.request.client.Router
 * @extends Jii.base.Component
 */
var Router = Jii.defineClass('Jii.request.client.Router', /** @lends Jii.request.client.Router.prototype */{

    __extends: Component,

    __static: /** @lends Jii.request.client.Router */{

        MODE_PUSH_STATE: 'push_state',
        MODE_HASH: 'hash'

    },

    /**
     * @type {Jii.controller.UrlManager|string}
     */
    urlManager: 'urlManager',

    mode: null,

    _bindRouteFunction: null,

    init() {
        this._bindRouteFunction = this._onRoute.bind(this);
        this._bindClickFunction = this._onClick.bind(this);

        if (_isString(this.urlManager)) {
            this.urlManager = Jii.app.getComponent(this.urlManager);
        }
        if (this.mode === null) {
            this.mode = window.history && window.history.pushState ?
                this.__static.MODE_PUSH_STATE :
                this.__static.MODE_HASH;
        }
    },

    start() {
        switch(this.mode) {
            case this.__static.MODE_PUSH_STATE:
                window.addEventListener('popstate', this._bindRouteFunction, false);

                if (window.addEventListener) {
                    window.addEventListener("click", this._bindClickFunction, false);
                } else if (window.attachEvent) {
                    window.attachEvent("click", this._bindClickFunction);
                }
                break;

            case this.__static.MODE_HASH:
                if (window.addEventListener) {
                    window.addEventListener("hashchange", this._bindRouteFunction, false);
                } else if (window.attachEvent) {
                    window.attachEvent("onhashchange", this._bindRouteFunction);
                }
                break;
        }

        // Run
        setTimeout(this._bindRouteFunction);
    },

    stop() {
        switch(this.mode) {
            case this.__static.MODE_PUSH_STATE:
                window.removeEventListener('popstate', this._bindRouteFunction);

                if (window.removeEventListener) {
                    window.removeEventListener("click", this._bindClickFunction, false);
                } else if (window.detachEvent) {
                    window.detachEvent("click", this._bindClickFunction);
                }
                break;

            case this.__static.MODE_HASH:
                if (window.removeEventListener) {
                    window.removeEventListener("hashchange", this._bindRouteFunction, false);
                } else if (window.detachEvent) {
                    window.detachEvent("onhashchange", this._bindRouteFunction);
                }
                break;
        }
    },

    /**
     *
     * @param {string|*[]} route
     * @returns {boolean}
     */
    goTo(route) {
        var url = this.urlManager.createAbsoluteUrl(route);
        if (!url) {
            return false;
        }

        switch(this.mode) {
            case this.__static.MODE_PUSH_STATE:
                history.pushState({}, '', url);
                this._onRoute();
                break;

            case this.__static.MODE_HASH:
                location.hash = '#' + url;
                break;
        }

        return true;
    },

    createUrl(route) {
        var url = this.urlManager.createAbsoluteUrl(route);
        if (!url) {
            return '#';
        }

        return '#' + url;
    },

    _getHash() {
        var match = window.location.href.match(/#(.*)$/);
        return match && match[1] ? match[1] : '';
    },

    _onRoute() {
        switch(this.mode) {
            case this.__static.MODE_PUSH_STATE:
                if (location.hash) {
                    history.replaceState({}, '', location.hash.substr(1));
                }
                break;

            case this.__static.MODE_HASH:
                break;
        }

        var request = new Request(location);
        var result = this.urlManager.parseRequest(request);
        if (result !== false) {
            var route = result[0];
            var params = result[1];

            // Append parsed params to request
            var queryParams = request.getQueryParams();
            request.setQueryParams(_extend(queryParams, params));

            var context = Jii.createContext({route: route});
            context.setComponent('request', request);
            context.setComponent('response', new Response());

            Jii.app.runAction(route, context);
        }
    },

    _onClick(e) {
        if (e.target && e.target.tagName.toLowerCase() === 'a') {
            let url = e.target.getAttribute('href') || '';
            if (url.indexOf('#') === 0) {
                e.preventDefault();

                history.pushState({}, '', url);
                this._onRoute();
            }
        }
    }

});

module.exports = Router;