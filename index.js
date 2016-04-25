var Jii = module.exports = require('./lib/Jii');
Jii.isNode = true;

Jii._ = require('underscore');
Jii._s = require('underscore.string');

// AUTO-GENERATED Package files list
require('./lib/Jii.js');
require('./lib/application/Environment.js');
require('./lib/application/WebApplication.js');
require('./lib/base/Action.js');
require('./lib/base/ActionEvent.js');
require('./lib/base/Application.js');
require('./lib/base/Behavior.js');
require('./lib/base/Component.js');
require('./lib/base/Context.js');
require('./lib/base/Controller.js');
require('./lib/base/Event.js');
require('./lib/base/HttpRequest.js');
require('./lib/base/ModelEvent.js');
require('./lib/base/Module.js');
require('./lib/base/Object.js');
require('./lib/base/Request.js');
require('./lib/base/Response.js');
require('./lib/exceptions/ApplicationException.js');
require('./lib/exceptions/InvalidCallException.js');
require('./lib/exceptions/InvalidConfigException.js');
require('./lib/exceptions/InvalidParamException.js');
require('./lib/exceptions/InvalidRouteException.js');
require('./lib/exceptions/NotSupportedException.js');
require('./lib/exceptions/UnknownPropertyException.js');
require('./lib/helpers/File.js');
require('./lib/helpers/String.js');
require('./lib/helpers/Url.js');
require('./lib/helpers/Util.js');
require('./lib/request/AnonymousAction.js');
require('./lib/request/HeaderCollection.js');
require('./lib/request/InlineAction.js');
require('./lib/server/base/UnitTest.js');
require('./lib/server/helpers/ClassLoader.js');

Jii.helpers.ClassLoader.packages();
