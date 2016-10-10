var Jii = require('jii');
var custom = require('./config');

require('jii-workers')
    .setEnvironment(custom.environment)
    .application(['http', 'comet'], function (environment, name) {
        return Jii.mergeConfigs(

            // Main config
            require('./app/config/base')(environment),
            require('./app/config/' + name)(environment),

            // Custom configuration
            custom.base || {},
            custom[name] || {}

        );
    });