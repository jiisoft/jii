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

/**
 * @class Jii.base.Request
 * @extends Jii.base.Component
 */
Jii.defineClass('Jii.base.Request', /** @lends Jii.base.Request.prototype */{

	__extends: 'Jii.base.Component',

    /**
     * @type {object}
     */
    _params: null,

	/**
	 * Resolves the current request into a route and the associated parameters.
	 * @returns {[]|null} the first element is the route, and the second is the associated parameters.
	 */
	resolve: function () {
		return null;
	},

    /**
     * @return {object}
     */
    getParams: function () {
        if (this._params === null) {
            this._params = this._parseParams();
        }
        return this._params;
    },

    /**
     * @param {object} values
     */
    setParams: function (values) {
        this._params = values;
    },

    /**
     * Returns the named GET parameter value.
     * @param {string} name the parameter name
     * @param {*} [defaultValue] the default parameter value if the parameter does not exist.
     * @return {*} the parameter value
     */
    getParam: function (name, defaultValue) {
        defaultValue = defaultValue || null;

        var params = this.getParams();
        return Jii._.has(params, name) ? params[name] : defaultValue;
    },

    /**
     * Returns the named GET parameter value.
     * If the GET parameter does not exist, the second parameter to this method will be returned.
     * @param {number|string} [name] the GET parameter name. If not specified, whole all get params is returned.
     * @param {*} [defaultValue] the default parameter value if the GET parameter does not exist.
     * @return {*} the GET parameter value
     */
    get: function (name, defaultValue) {
        name = name || name === 0 ? name : null;
        defaultValue = defaultValue || null;

        return name === null ? this.getParams() : this.getParam(name, defaultValue);
    },

    _parseParams: function () {
    }

});
