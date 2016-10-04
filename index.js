var Jii = module.exports = require('./Jii');
Jii.isNode = true;

// AUTO-GENERATED Package files list
if (!process.env.JII_NO_NAMESPACE) {
    require('./Jii.js');
    require('./application/Environment.js');
    require('./application/WebApplication.js');
    require('./base/Action.js');
    require('./base/ActionEvent.js');
    require('./base/Application.js');
    require('./base/Behavior.js');
    require('./base/Component.js');
    require('./base/Context.js');
    require('./base/Controller.js');
    require('./base/ErrorHandler.js');
    require('./base/Event.js');
    require('./base/HttpRequest.js');
    require('./base/ModelEvent.js');
    require('./base/Module.js');
    require('./base/Object.js');
    require('./base/Request.js');
    require('./base/Response.js');
    require('./exceptions/ApplicationException.js');
    require('./exceptions/InvalidCallException.js');
    require('./exceptions/InvalidConfigException.js');
    require('./exceptions/InvalidParamException.js');
    require('./exceptions/InvalidRouteException.js');
    require('./exceptions/NotSupportedException.js');
    require('./exceptions/UnknownPropertyException.js');
    require('./helpers/File.js');
    require('./helpers/String.js');
    require('./helpers/Url.js');
    require('./helpers/Util.js');
    require('./request/AnonymousAction.js');
    require('./request/HeaderCollection.js');
    require('./request/InlineAction.js');
    require('./server/base/UnitTest.js');
    require('./server/helpers/ClassLoader.js');

    Jii.helpers.ClassLoader.packages();
}
