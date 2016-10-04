/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

var Jii = require('../BaseJii');
var Object = require('../base/Object');

/**
 *
 * @class Jii.helpers.Util
 * @extends Jii.base.Object
 */
module.exports = Jii.defineClass('Jii.helpers.Util', /** @lends Jii.helpers.Util.prototype */{

	__extends: Object,

	__static: /** @lends Jii.helpers.Util */{

        /**
         *
         * @param {*} obj
         * @returns {boolean}
         */
        isStrictObject(obj) {
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

});