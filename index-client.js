var Jii = module.exports = require('./Jii');
Jii.isNode = false;

window.Jii = Jii;
Jii.namespaceMoveContext(window);

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
    require('./data/ActiveRecord.js');
    require('./data/FilterBuilder.js');
    require('./data/http/ActiveRecordAction.js');
    require('./data/http/Command.js');
    require('./data/http/Connection.js');
    require('./data/http/Schema.js');
    require('./data/http/TransportInterface.js');
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
    require('./request/UrlManager');
    require('./request/UrlRule');
    require('./view/ClientWebView');
    require('./view/IRenderer.js');
    require('./view/View.js');
    require('./view/ViewEvent.js');
    require('./view/WebView.js');
}