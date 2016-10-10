module.exports = {
    application: {
        components: {
            appServerRequest: {
                url: 'http://app.example.com'
            },
            logger: {
                level: 'info'
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
                        trackingId: 'UA-5122562-1'
                    }
                }
            }
        },
        params: {
            filesBaseUrl: 'http://traffic6.example.com/files'
        }
    }
};