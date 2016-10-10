module.exports = {
    application: {
        components: {
            appServerRequest: {
                className: 'watch.components.ServerRequest',
                token: 'UqLOTI162587632GraeBnrYibCqfsoPo'
            },
            clientIpDetector: {
                className: 'watch.components.ClientIpDetector',
                proxyList: [
                    // See actually list on https://www.cloudflare.com/ips
                    '199.27.128.0/21',
                    '173.245.48.0/20',
                    '103.21.244.0/22',
                    '103.22.200.0/22',
                    '103.31.4.0/22',
                    '141.101.64.0/18',
                    '108.162.192.0/18',
                    '190.93.240.0/20',
                    '188.114.96.0/20',
                    '197.234.240.0/22',
                    '198.41.128.0/17',
                    '162.158.0.0/15',
                    '104.16.0.0/12'
                ]
            },
            db: {
                className: 'Jii.sql.mysql.Connection',
                host: 'localhost',
                username: 'root',
                password: '',
                database: 'site'
            },
            time: {
                timezone: '+0000'
            },
            logger: {
                enable: true,
                level: 'info'
            }
        },

        modules: {
            ers: {
                className: 'app.ers.ErsModule',
                enable: true,
                components: {
                    db: {
                        className: 'Jii.sql.mysql.Connection',
                        host: 'ers.example.com',
                        username: 'ers',
                        password: 'kbGt5agP6zAQnLwKzJSXLwpdx8It7yNl',
                        database: 'ers'
                    }
                }
            },
            assist: {
                className: 'app.assist.AssistModule',
                components: {
                    domainsBlocker: {
                        className: 'app.assist.components.DomainsBlocker',
                        domains: [
                            'xxx.net' // [09.02.2015 20:14:38]
                        ]
                    }
                }
            },
            online: {
                className: 'app.online.OnlineModule',
                offlineTimeout: 10, // 10 sec
                userRemoveDelay: 3600 * 12 // 12 hours
            },
            statistics: {
                enable: false,
                className: 'app.statistics.StatisticsModule',
                components: {
                    db: {
                        className: 'Jii.sql.mysql.Connection',
                        host: 'localhost',
                        port: 3306,
                        username: 'root',
                        password: '',
                        database: 'stats'
                    },
                    measurement: {
                        className: 'app.statistics.components.Measurement'
                    }
                }
            }
        },
        params: {
            filesBaseUrl: ''
        }
    }
};