/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

/**
 * @namespace Jii
 * @ignore
 */
var Jii = require('../Jii');

require('../base/Object');

/**
 * BaseFileHelper provides concrete implementation for [[FileHelper]].
 *
 * Do not use BaseFileHelper. Use [[FileHelper]] instead.
 *
 * @class Jii.helpers.String
 * @extends Jii.base.Object
 */
Jii.defineClass('Jii.helpers.String', {

	__extends: Jii.base.Object,

	__static: {

		/**
		 * Generate unique hash for string. http://jsperf.com/hashcodelordvlad
		 * @param {String} str
		 * @returns {String}
		 */
		hashCode: function(str){
			return str.split("").reduce(function (a, b) {
				a = ((a << 5) - a) + b.charCodeAt(0);
				return a & a;
			}, 0).toString().replace(/-/g, '1');
		},

		generateUid: function () {
			return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
				var r = Math.random()*16|0;
				var v = c == 'x' ? r : (r&0x3|0x8);

				return v.toString(16);
			});
		}

	}

});