var Jii = require('jii');
var custom = require('./config');

require('jii-workers')
    .setEnvironment(custom.environment)

    // Comet server
    .application('comet', function (environment) {
        return Jii.mergeConfigs(
            require('./configuration/comet/main')(environment),
            custom.comet
        );
    })

    // Garbage collector
    .application('gc', function () {
        return Jii.mergeConfigs(
            require('./configuration/gc/main'),
            custom.gc
        );
    })

    // Application
    .application(['http', 'online'], function (environment, name) {
        var envConfig = {};
        try {
            envConfig = require('./configuration/' + name + '/' + environment.getName());
        } catch (e) {
        }

        return Jii.mergeConfigs(

            // Main config
            require('./configuration/base/main'),
            require('./configuration/base/' + environment.getName()),
            require('./configuration/' + name + '/main'),
            envConfig,

            // Custom configuration
            custom.base,
            custom[name]

        );
    });