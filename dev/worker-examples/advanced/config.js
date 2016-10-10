module.exports = {
	environment: 'development',
	base: {
		application: {
			components: {
				appServerRequest: {
					url: 'http://example.local/ws/chat'
				},
				db: {
					host: 'localhost',
					username: 'root',
					password: '1',
					database: 'dev_site'
				}
			},
			modules: {
				ers: {
					enable: true
				},
				statistics: {
					enable: true,
					components: {
						db: {
							host: 'localhost',
							username: 'root',
							password: '1',
							database: 'dev_site_stats'
						},
						measurement: {
							enable: true,
							enableDebugMode: true,
							trackingId: 'UA-12346677-1' // alexandr id
						}
					}
				}
			},
			params: {
				serverNumber: 1,
				filesBaseUrl: 'http://example.local/files'
			}
		}
	},
	gc: {
		application: {
			components: {
				redisHub: {
					password: 'z9RJfddlGOt0G18tNSxI7mmKkrgeuFqR'
				}
			}
		}
	},
	comet: {
		workers: 1
	},
	http: {
		workers: 1
	}
};