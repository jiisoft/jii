/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

var Jii = require('../Jii');
var Object = require('../base/Object');

/**
 * BaseFileHelper provides concrete implementation for [[FileHelper]].
 *
 * Do not use BaseFileHelper. Use [[FileHelper]] instead.
 *
 * @class Jii.helpers.String
 * @extends Jii.base.Object
 */
module.exports = Jii.defineClass('Jii.helpers.String', /** @lends Jii.helpers.String.prototype */{

	__extends: Object,

	__static: /** @lends Jii.helpers.String */{

		/**
		 * Generate unique hash for string. http://jsperf.com/hashcodelordvlad
		 * @param {String} str
		 * @returns {String}
		 */
		hashCode(str){
			return str.split("").reduce((a, b) => {
				a = ((a << 5) - a) + b.charCodeAt(0);
				return a & a;
			}, 0).toString().replace(/-/g, '1');
		},

		generateUid() {
			return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
				var r = Math.random()*16|0;
				var v = c == 'x' ? r : (r&0x3|0x8);

				return v.toString(16);
			});
		}

	}

});