/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

const Jii = require('../BaseJii');
const BaseObject = require('../base/BaseObject');

class Util extends BaseObject {

    /**
     *
     * @param {*} obj
     * @returns {boolean}
     */
    static isStrictObject(obj) {
        if (!obj || typeof obj !== 'object' || obj instanceof RegExp || obj instanceof Date || obj instanceof Array) {
            return false;
        }

        var bool = true;
        for (var key in obj) {
            bool = bool && obj.hasOwnProperty(key);
        }
        return bool;
    }

}
module.exports = Util;