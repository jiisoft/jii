'use strict';

var Jii = require('../../BaseJii');
var Controller = require('../../base/Controller');

var SiteController = Jii.defineClass('app.controllers.SiteController', {

    __extends: Controller,

    actionIndex: function(context) {
        var request = context.getComponent('request');
        var response = context.getComponent('response');

        response.data = 'test' + request.get('testParam');
        response.send();
    }

});

module.exports = SiteController;