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

require('./ApplicationException');

/**
 * @class Jii.exceptions.InvalidRouteException
 * @extends Jii.exceptions.ApplicationException
 */
Jii.defineClass('Jii.exceptions.InvalidRouteException', /** @lends Jii.exceptions.InvalidRouteException.prototype */{

	__extends: Jii.exceptions.ApplicationException

});
