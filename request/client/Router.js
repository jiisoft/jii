/**
 *
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */
'use strict';

const Jii = require('../../BaseJii');
const Request = require('./Request');
const Response = require('./Response');
const Component = require('../../base/Component');
const _isString = require('lodash/isString');
const _extend = require('lodash/extend');
const _upperFirst = require('lodash/upperFirst');

class Router extends Component {

    preInit() {
        this._bindRouteFunction = null;
        this.mode = null;
        /**
         * @type {UrlManager|string}
         */
        this.urlManager = 'urlManager';
        super.preInit(...arguments);
    }

    init() {
        this._bindRouteFunction = this._onRoute.bind(this);
        this._bindClickFunction = this._onClick.bind(this);

        if (_isString(this.urlManager)) {
            this.urlManager = Jii.app.getComponent(this.urlManager);
        }
        if (this.mode === null) {
            this.mode = window.history && window.history.pushState ? Router.MODE_PUSH_STATE : Router.MODE_HASH;
        }
    }

    start() {
        switch (this.mode) {
            case Router.MODE_PUSH_STATE:
                window.addEventListener('popstate', this._bindRouteFunction, false);

                if (window.addEventListener) {
                    window.addEventListener('click', this._bindClickFunction, false);
                } else if (window.attachEvent) {
                    window.attachEvent('click', this._bindClickFunction);
                }
                break;

            case Router.MODE_HASH:
                if (window.addEventListener) {
                    window.addEventListener('hashchange', this._bindRouteFunction, false);
                } else if (window.attachEvent) {
                    window.attachEvent('onhashchange', this._bindRouteFunction);
                }
                break;
        }

        // Run
        setTimeout(this._bindRouteFunction);
    }

    stop() {
        switch (this.mode) {
            case Router.MODE_PUSH_STATE:
                window.removeEventListener('popstate', this._bindRouteFunction);

                if (window.removeEventListener) {
                    window.removeEventListener('click', this._bindClickFunction, false);
                } else if (window.detachEvent) {
                    window.detachEvent('click', this._bindClickFunction);
                }
                break;

            case Router.MODE_HASH:
                if (window.removeEventListener) {
                    window.removeEventListener('hashchange', this._bindRouteFunction, false);
                } else if (window.detachEvent) {
                    window.detachEvent('onhashchange', this._bindRouteFunction);
                }
                break;
        }
    }

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

        switch (this.mode) {
            case Router.MODE_PUSH_STATE:
                history.pushState({}, '', url);
                this._onRoute();
                break;

            case Router.MODE_HASH:
                location.hash = url;
                break;
        }

        return true;
    }

    createUrl(route) {
        var url = this.urlManager.createAbsoluteUrl(route);
        if (!url) {
            return '#';
        }

        return '#' + url;
    }

    _getHash() {
        var match = window.location.href.match(/#(.*)$/);
        return match && match[1] ? match[1] : '';
    }

    _onRoute() {
        switch (this.mode) {
            case Router.MODE_PUSH_STATE:
                if (location.hash) {
                    history.replaceState({}, '', location.hash.substr(1));
                }
                break;

            case Router.MODE_HASH:
                break;
        }

        var request = new Request(location);
        var result = this.urlManager.parseRequest(request);
        const urlPathes = result[0].split('/');
        const moduleName = urlPathes[0];
        const controllerName = urlPathes[1]
                .split('-')
                .map(s => _upperFirst(s)) //to upper first symbol
                .join('') + 'Controller';

        if (result !== false &&
            Jii.app.getModule(moduleName) &&
            Object.keys(Jii.app.getModule(moduleName).controllerMap).indexOf(controllerName) !== -1 ||
            moduleName == '')
        {
            var route = result[0];
            var params = result[1];

            // Append parsed params to request
            var queryParams = request.getQueryParams();
            request.setQueryParams(_extend(queryParams, params));

            var context = Jii.createContext({
                route: route
            });
            context.setComponent('request', request);
            context.setComponent('response', new Response());
            Jii.app.runAction(route, context);
            Router.lasHref = window.location.href;
        }
        else if(Router.lasHref != '') {
            Router.lasHref = window.location.href;
            window.location.href = window.location.href;
        }
    }

    _onClick(e) {
        if (e.target && e.target.tagName.toLowerCase() === 'a') {
            let url = e.target.getAttribute('href') || '';
            e.preventDefault();

            if(url != 'javascript:void(0)') {
                history.pushState({}, '', url);
                this._onRoute();
            }
        }
    }

}
Router.lasHref = '';
Router.MODE_HASH = 'hash';

Router.MODE_PUSH_STATE = 'push_state';
module.exports = Router;