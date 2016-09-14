/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

var Jii = require('../Jii');
var _trim = require('lodash/trim');
var _isObject = require('lodash/isObject');
var _isString = require('lodash/isString');
var _isArray = require('lodash/isArray');
var Object = require('../base/Object');

/**
 *
 * @class Jii.helpers.Url
 * @extends Jii.base.Object
 */
module.exports = Jii.defineClass('Jii.helpers.Url', /** @lends Jii.helpers.Url.prototype */{

	__extends: Object,

	__static: /** @lends Jii.helpers.Url */{

        /**
         * @type {Jii.urlManager.UrlManager}
         */
        urlManager: null,

		/**
		 * Returns a value indicating whether a URL is relative.
		 * A relative URL does not have host info part.
		 * @param {string} url the URL to be checked
		 * @returns {boolean} whether the URL is relative
		 */
		isRelative(url) {
			return url.indexOf('//') !== 0 && url.indexOf('://') === -1;
		},

        to(url, context, scheme) {
            if (_isObject(url)) {
                return this.__static.toRoute(url, context, scheme);
            }

            return url;

            // @todo
            /*$url = Yii::getAlias($url);
            if ($url === '') {
                $url = Yii::$app->getRequest()->getUrl();
            }

            if (!$scheme) {
                return $url;
            }

            if (strncmp($url, '//', 2) === 0) {
                // e.g. //hostname/path/to/resource
                return is_string($scheme) ? "$scheme:$url" : $url;
            }

            if (($pos = strpos($url, ':')) === false || !ctype_alpha(substr($url, 0, $pos))) {
                // turn relative URL into absolute
                $url = static::getUrlManager()->getHostInfo() . '/' . ltrim($url, '/');
            }

            if (is_string($scheme) && ($pos = strpos($url, ':')) !== false) {
                // replace the scheme with the specified one
                $url = $scheme . substr($url, $pos);
            }

            return $url;*/
        },

        toRoute(route, context, scheme) {
            scheme = scheme || false;

            if (!_isObject(route)) {
                route = [route];
            }

            return scheme ?
                this.__static._getUrlManager().createAbsoluteUrl(route, context, _isString(scheme) ? scheme : null) :
                this.__static._getUrlManager().createUrl(route, context);
        },

        /**
         *
         * @returns {Jii.urlManager.UrlManager}
         * @private
         */
        _getUrlManager() {
            return this.__static.urlManager || Jii.app.urlManager;
        },

        /**
         *
         * @param {string|array|object} route
         * @param {Jii.base.Context} context
         * @returns {{route: string, params: {}}}
         */
        parseRoute(route, context) {
            var params = {};

            // Format ['site/index', {foo: 'bar'}]
            if (_isArray(route)) {
                if (_isObject(route[1]) && route.length === 2) {
                    params = route[1];
                }
                route = route[0];
            }

            // Format {0:'site/index', foo: 'bar'}
            if (_isObject(route)) {
                params = route;
                route = params[0] || '';
                delete params[0];
            }

            return {
                route: this.__static._normalizeRoute(route, context),
                params: params
            };
        },

        _normalizeRoute(route, context) {
            route = Jii.getAlias(route);
            if (route.substr(0, 1) === '/') {
                // absolute route
                return _trim(route, '/');
            }

            // relative route
            // @todo
            /*if (!Jii.app || Jii.app.controller === null) {
                throw new InvalidParamException("Unable to resolve the relative route: $route. No active controller is available.");
            }

            if (strpos($route, '/') === false) {
                // empty or an action ID
                return $route === '' ? Yii::$app->controller->getRoute() : Yii::$app->controller->getUniqueId() . '/' . $route;
            } else {
                // relative to module
                return ltrim(Yii::$app->controller->module->getUniqueId() . '/' . $route, '/');
            }*/
        }
	}

});