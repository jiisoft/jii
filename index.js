/**
 * Require relations libs and jii files
 *
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

/**
 * @namespace Jii
 * @ignore
 */
var Jii = module.exports = require('./lib/Jii');

// Load global libraries

Jii._ = require('lodash');
Jii._s = require('underscore.string');
Jii.isNode = true;

// Load framework files
require('require-all')(__dirname + '/lib');
