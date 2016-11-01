'use strict';

var Jii = require('../BaseJii');
var SiteController = require('./controllers/SiteController');

Jii.createWebApplication({
    application: {
        basePath: __dirname,
        controllerMap: {
            SiteController: SiteController
        }
    }
});