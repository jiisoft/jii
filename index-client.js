/**
 * Require relations libs and jii files
 *
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

/**
 * @namespace Jii
 * @ignore
 */
var Jii = module.exports = window.Jii = require('./lib/Jii');

// Global libraries
Jii._ = window._;
Jii._s = window.s;
Jii.isNode = false;

// Load framework files
require('./lib/application/WebApplication');
require('./lib/base/Action');
require('./lib/base/Application');
require('./lib/base/Behavior');
require('./lib/base/Component');
require('./lib/base/Context');
require('./lib/base/Controller');
require('./lib/base/Event');
require('./lib/base/HttpRequest');
require('./lib/base/ModelEvent');
require('./lib/base/Module');
require('./lib/base/Object');
require('./lib/base/Request');
require('./lib/base/Response');
require('./lib/exceptions/ApplicationException');
require('./lib/exceptions/InvalidCallException');
require('./lib/exceptions/InvalidConfigException');
require('./lib/exceptions/InvalidParamException');
require('./lib/exceptions/InvalidRouteException');
require('./lib/exceptions/NotSupportedException');
require('./lib/exceptions/UnknownPropertyException');
require('./lib/helpers/String');
require('./lib/helpers/Url');
