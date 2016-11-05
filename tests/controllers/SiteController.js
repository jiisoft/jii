'use strict';

var Jii = require('../../BaseJii');
var Controller = require('../../base/Controller');

var SiteController = Jii.defineClass('app.controllers.SiteController', {

    __extends: Controller,

    actionIndex(context) {
        var request = context.getComponent('request');
        var response = context.getComponent('response');

        response.data = 'test' + request.get('testParam');
        response.send();
    },

    actionTest(context) {
        var response = context.getComponent('response');

        response.data = 'test1test';
        response.send();
    },

    actionTest2(context) {
        var response = context.getComponent('response');

        response.data = 'test2test';
        response.send();
    }

});

module.exports = SiteController;