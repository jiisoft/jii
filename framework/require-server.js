/**
 * Require relations libs and jii files
 *
 * @author Vladimir Kozhin <affka@affka.ru>
 * @author Dmitriy Yurchenko <evildev@evildev.ru>
 * @license MIT
 */

// Load global libraries
global._ = require('./../lib/lodash/lodash');
global._.string = require('./../lib/underscore/underscore.string');
require('./../lib/es6-promise/promise');

// Load Jii files
require('./utils/classes');
require('./Jii');
require('./base/Object');
require('./base/Component');
require('./base/Context');
require('./base/Event');
require('./base/Behavior');
require('./base/Module');
require('./base/Application');
require('./base/UnitTest');
require('./application/ConsoleApplication');
require('./application/WebApplication');
require('./controller/BaseAction');
require('./controller/BaseController');
require('./controller/BaseRequest');
require('./controller/BaseResponse');
require('./controller/BaseHttpRequest');
require('./controller/HeaderCollection');
require('./controller/InlineAction');
require('./controller/UrlManager');
require('./controller/UrlRule');
require('./controller/httpServer/HttpServer');
require('./controller/httpServer/Request');
require('./controller/httpServer/Response');
require('./data/Model');
require('./data/BaseActiveRecord');
require('./validator/Validator');
require('./validator/BooleanValidator');
require('./validator/CompareValidator');
require('./validator/DateValidator');
require('./validator/DefaultValueValidator');
require('./validator/EmailValidator');
require('./validator/FilterValidator');
require('./validator/InlineValidator');
require('./validator/NumberValidator');
require('./validator/RangeValidator');
require('./validator/RegularExpressionValidator');
require('./validator/RequiredValidator');
require('./validator/SafeValidator');
require('./validator/StringValidator');
require('./validator/UrlValidator');
require('./exceptions/ApplicationException');
require('./exceptions/InvalidCallException');
require('./exceptions/InvalidConfigException');
require('./exceptions/InvalidParamException');
require('./exceptions/InvalidRouteException');
require('./exceptions/NotSupportedException');

require('./data/sql/require-server');