module.exports = {
    application: {
        components: {
            appServerRequest: {
                url: 'http://example.local/ws/chat'
            },
            db: {
                database: 'example_v1.3'
            },
            logger: {
                level: 'debug'
            }
        },
        modules: {
            ers: {
                enable: false
            },
            online: {
                offlineTimeout: 15, // 15 sec
                userRemoveDelay: 30 // 30 sec
            },
            assist: {
                enableCache: false
            },
            statistics: {
                enable: true,
                components: {
                    db: {
                        database: 'site_v1.3_stats'
                    }
                }
            }
        }
    }
};