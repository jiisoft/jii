module.exports = {
    application: {
		components: {
			appServerRequest: {
				url: 'http://app.example.com'
			},
			logger: {
				level: 'error'
			},
			db: {
				host: 'app.example.com',
				username: 'tm',
				database: 'site'
			}
		},
		modules: {
			statistics: {
				components: {
					db: {
						host: 'app.example.com',
						username: 'tm',
						database: 'site_stats'
					},
					measurement: {
						enable: true,
						trackingId: 'UA-3146658-2'
					}
				}
			}
		},
		params: {
			filesBaseUrl: 'http://traffic1.example.com/files'
		}
	}
};