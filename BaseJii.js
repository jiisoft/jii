/**
 * Jii — Full-Stack JavaScript Framework based on PHP Yii 2 Framework architecture.
 *
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

var _isString = require('lodash/isString');
var _extend = require('lodash/extend');

var Jii = {};

/**
 * @class BaseJii
 */
_extend(Jii, /** @lends BaseJii */{

    /**
     * True, if running in node js
     * @type {boolean}
     */
    isNode: typeof window === 'undefined',

    /**
     * @type {boolean}
     */
    debug: true,

    /**
     * Returns framework version
     * @returns {string}
     */
    getVersion() {
        return require('./package.json').version;
    },

    /**
     * Get class by full namespace.
     * @param {string} name
     * @returns {function|object}
     */
    namespace(name) {
        if (_isString(name)) {
            throw new Error(`String class names is deprecated, please import real class "${name}"`);
        }
        return name;
    },

    /**
     * Move namespace to other object
     * @param {object} newContext
     * @param {boolean} [removeFromOld]
     * @returns {*|Function|Object}
     */
    namespaceMoveContext(newContext, removeFromOld) {
        throw new Error(`Method namespaceMoveContext() is deprecated.`);
    },

    /**
     * @param {string} globalName
     * @param {object} options
     * @deprecated
     * @return {object}
     */
    defineClass(globalName, options) {
        throw new Error(`Method defineClass() is deprecated. Use es6 class for create ${globalName}`);
    }

});

// @todo Move to Errors module
process.on('unhandledRejection', (reason, promise) => {
    console.warn("Possibly Unhandled Rejection at: Promise ", promise, " reason: ", reason);
});

/**
 * @module Jii
 */
module.exports = Jii;