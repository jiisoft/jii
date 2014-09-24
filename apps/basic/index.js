require('./../../index.js');
require('./controllers/SiteController');
require('./models/TextModel');

Jii.createWebApplication({
	application: {
		basePath: __dirname,
		components: {
			urlManager: {
				className: 'Jii.controller.UrlManager',
				rules: {
					'': 'site/index'
				}
			},
			http: {
				className: 'Jii.controller.httpServer.HttpServer'
			}
		}
	}
});

Jii.app.http.start();