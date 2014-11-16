/**
 * Require relations libs and jii files
 *
 * @author Vladimir Kozhin <affka@affka.ru>
 * @author Dmitriy Yurchenko <evildev@evildev.ru>
 * @license MIT
 */

// Load global libraries
global._ = require('./lib/lodash/lodash');
global._.string = require('./lib/underscore/underscore.string');
require('./lib/es6-promise/promise');

// Load Jii files
module.exports = require('./framework/Jii');
require('require-all')(__dirname + '/framework');
