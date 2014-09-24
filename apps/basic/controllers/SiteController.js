/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */

var fs = require('fs');

/**
 * @class app.controllers.SiteController
 * @extends Jii.controller.BaseController
 */
var self = Jii.defineClass('app.controllers.SiteController', {

	__extends: Jii.controller.BaseController,

	actionIndex: function(context) {
		var model = new app.models.TextModel();
		var indexTemplate = fs.readFileSync(__dirname + '/../templates/index.html');

		model.setAttributes(context.request.get());

		model.validate().then(function(success) {
			context.response.data = _.template(indexTemplate, model.getAttributes());

			if (success) {
				context.response.data += 'You text: ' + model.get('text');
			} else {
				context.response.data += 'Error: ' + model.getErrors('text').join();
			}

			context.response.send();
		});
	}

});