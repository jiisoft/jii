'use strict';

var Jii = require('../BaseJii');
var SiteController = require('./controllers/SiteController');

Jii.createWebApplication({
    application: {
        controllerMap: {
            SiteController: SiteController
        }
    }
});

// AR: display errors in callbacks defined within the tests
process.on('uncaughtException', function (e) {
    console.log("Uncaught exception:\n" + e.stack);
});