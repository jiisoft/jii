
module.exports = {
	application: { // Jii.app
		components: {
			urlManager: {
				// ...
			},
			cache: {
				// ...
			},
			logger: {
				// ...
			},
			httpServer: {
				// ...
			},
			socketServer: {
				// ...
			}
		},
		modules: {
			aritcles: { // example custom module
				className: 'app.articles.ArticlesModule',
				pageLength: 10,
				components: {
					articleFormatter: { // example custom component
						// ...
					}
				}
			}
		}
	},
	context: { // variable `context` in action method
		components: {
			request: {
				// ...
			},
			user: {
				// ...
			},
			session: {

			}
		}
	}
};