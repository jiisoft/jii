var Jii = module.exports = require('./Jii');
Jii.isNode = true;

// AUTO-GENERATED Package files list
if (!process.env.JII_NO_NAMESPACE) {
    require('./Jii.js');
    require('./application/ConsoleApplication.js');
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
    require('./base/UnitTest.js');
    require('./console/controllers/HelpController.js');
    require('./console/controllers/ServiceController.js');
    require('./console/controllers/BaseMigrateController.js');
    require('./console/controllers/MigrateController.js');
    require('./console/Controller.js');
    require('./console/Exception.js');
    require('./console/Request.js');
    require('./console/Response.js');
    require('./data/ActiveRecord.js');
    require('./data/FilterBuilder.js');
    require('./data/BaseConnection.js');
    require('./data/BaseSchema.js');
    require('./data/ColumnSchema.js');
    require('./data/ColumnSchemaBuilder.js');
    require('./data/Command.js');
    require('./data/Migration.js');
    require('./data/QueryBuilder.js');
    require('./data/SqlQueryException.js');
    require('./data/TableSchema.js');
    require('./exceptions/ApplicationException.js');
    require('./exceptions/InvalidCallException.js');
    require('./exceptions/InvalidConfigException.js');
    require('./exceptions/InvalidParamException.js');
    require('./exceptions/InvalidRouteException.js');
    require('./exceptions/NotSupportedException.js');
    require('./exceptions/UnknownPropertyException.js');
    require('./helpers/ClassLoader.js');
    require('./helpers/Console.js');
    require('./helpers/File.js');
    require('./helpers/String.js');
    require('./helpers/Url.js');
    require('./helpers/Util.js');
    require('./request/AnonymousAction.js');
    require('./request/HeaderCollection.js');
    require('./request/InlineAction.js');
    require('./request/UrlManager');
    require('./request/UrlRule');
    require('./request/http/HttpServer.js');
    require('./request/http/Request.js');
    require('./request/http/Response.js');
    require('./workers/ChildWorker.js');
    require('./workers/Manager.js');
    require('./workers/MasterWorker.js');
    require('./workers/MessageEvent.js');
    require('./workers/Request.js');
    require('./workers/Response.js');
    require('./view/ServerWebView.js');
    require('./view/underscore/UnderscoreRenderer.js');
    require('./view/IRenderer.js');
    require('./view/View.js');
    require('./view/ViewEvent.js');
    require('./view/WebView.js');

    Jii.helpers.ClassLoader.packages();
}
