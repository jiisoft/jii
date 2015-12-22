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
 *
 * @class Jii.helpers.Url
 * @extends Jii.base.Object
 */
Jii.defineClass('Jii.helpers.Url', /** @lends Jii.helpers.Url.prototype */{

	__extends: 'Jii.base.Object',

	__static: /** @lends Jii.helpers.Url */{

		/**
		 * Returns a value indicating whether a URL is relative.
		 * A relative URL does not have host info part.
		 * @param {string} url the URL to be checked
		 * @returns {boolean} whether the URL is relative
		 */
		isRelative: function (url) {
			return url.indexOf('//') !== 0 && url.indexOf('://') === -1;
		}
	}

});