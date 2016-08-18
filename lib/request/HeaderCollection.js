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
 * HeaderCollection is used by [[Jii.base.Response]] to maintain the currently registered HTTP headers.
 *
 * @class Jii.request.HeaderCollection
 * @extends Jii.base.Object
 */
Jii.defineClass('Jii.request.HeaderCollection', /** @lends Jii.request.HeaderCollection */{

	__extends: 'Jii.base.Object',

    _headers: null,

    init() {
        this._headers = {};
    },

    /**
     * Returns the named header(s).
     * @param {string} name the name of the header to return
     * @param {*} [defaultValue] the value to return in case the named header does not exist
     * @param {boolean} [isFirst] whether to only return the first header of the specified name.
     * If false, all headers of the specified name will be returned.
     * @return [string|array] the named header(s). If `first` is true, a string will be returned;
     * If `first` is false, an array will be returned.
     */
    get(name, defaultValue, isFirst) {
        defaultValue = defaultValue || null;
        if (Jii._.isUndefined(isFirst)) {
            isFirst = true;
        }

        name = name.toLowerCase();
        if (Jii._.has(this._headers, name)) {
            return isFirst ? Jii._.first(this._headers[name]) : this._headers[name];
        }

        return defaultValue;
    },

    /**
     * Adds a new header.
     * If there is already a header with the same name, it will be replaced.
     * @param {string} name the name of the header
     * @param {string} [value] the value of the header
     * @return {static} the collection object itself
     */
    set(name, value) {
        value = value || '';

        name = name.toLowerCase();
        this._headers[name] = Jii._.isArray(value) ? value : [value];

        return this;
    },

    /**
     * Adds a new header.
     * If there is already a header with the same name, the new one will
     * be appended to it instead of replacing it.
     * @param {string} name the name of the header
     * @param {string} value the value of the header
     * @return {static} the collection object itself
     */
    add(name, value) {
        name = name.toLowerCase();
        if (Jii._.isArray(this._headers[name])) {
            this._headers[name] = this._headers[name].concat(value);
        } else {
            this.set(name, value);
        }

        return this;
    },

    /**
     * Sets a new header only if it does not exist yet.
     * If there is already a header with the same name, the new one will be ignored.
     * @param {string} name the name of the header
     * @param {string} [value] the value of the header
     * @return {static} the collection object itself
     */
    setDefault(name, value) {
        value = value || '';

        name = name.toLowerCase();
        if (!this.has(name)) {
            this.set(name, value);
        }

        return this;
    },

    /**
     * Returns a value indicating whether the named header exists.
     * @param {string} name the name of the header
     * @return {boolean} whether the named header exists
     */
    has(name) {
        name = name.toLowerCase();
        return Jii._.has(this._headers, name) && this._headers[name].length > 0;
    },

    /**
     * Removes a header.
     * @param {string} name the name of the header to be removed.
     * @return {string|null} the value of the removed header. Null is returned if the header does not exist.
     */
    remove(name) {
        name = name.toLowerCase();
        if (Jii._.has(this._headers, name)) {
            var value = this._headers[name];
            delete this._headers[name];

            return value;
        }
        return null;
    },

    /**
     * Removes all headers.
     */
    removeAll() {
        this._headers = {};
    },

    /**
     * Returns the collection as a key-value object.
     * @return {object}
     */
    toJSON() {
        var headers = {};
        Jii._.each(this._headers, (value, key) => {
            headers[key] = Jii._.first(value);
        });
        return headers;
    }

});
