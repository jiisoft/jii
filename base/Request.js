/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */

'use strict';

var Jii = require('../BaseJii');
var _has = require('lodash/has');
var Component = require('./Component');

class Request extends Component {

    preInit() {
        /**
         * @type {object}
         */
        this._params = null;

        super.preInit(...arguments);
    }

    /**
     * Resolves the current request into a route and the associated parameters.
     * @returns {[]|null} the first element is the route, and the second is the associated parameters.
     */
    resolve() {
        return null;
    }

    /**
     * @return {object}
     */
    getParams() {
        if (this._params === null) {
            this._params = this._parseParams();
        }
        return this._params;
    }

    /**
     * @param {object} values
     */
    setParams(values) {
        this._params = values;
    }

    /**
     * Returns the named GET parameter value.
     * @param {string} name the parameter name
     * @param {*} [defaultValue] the default parameter value if the parameter does not exist.
     * @return {*} the parameter value
     */
    getParam(name, defaultValue) {
        defaultValue = defaultValue || null;

        var params = this.getParams();
        return _has(params, name) ? params[name] : defaultValue;
    }

    /**
     * Returns the named GET parameter value.
     * If the GET parameter does not exist, the second parameter to this method will be returned.
     * @param {number|string} [name] the GET parameter name. If not specified, whole all get params is returned.
     * @param {*} [defaultValue] the default parameter value if the GET parameter does not exist.
     * @return {*} the GET parameter value
     */
    get(name, defaultValue) {
        name = name || name === 0 ? name : null;
        defaultValue = defaultValue || null;

        return name === null ? this.getParams() : this.getParam(name, defaultValue);
    }

    _parseParams() {
    }

}
module.exports = Request;