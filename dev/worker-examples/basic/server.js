var Jii = require('jii');
var custom = require('./config');

require('jii-workers')
    .application(Jii.mergeConfigs(
        // Main config
        {
            application: {
                basePath: __dirname,
                components: {
                    db: {
                        className: 'Jii.sql.mysql.Connection',
                        database: 'site',
                        username: 'site',
                        password: ''
                    }
                }
            }
        },

        // Custom configuration
        custom
    ));