'use strict';

var Jii = require('jii');
var _each = require('lodash/each');
var BaseRequest = require('jii/base/Request');
var minimist = require('minimist');

/**
 * The console Request represents the environment information for a console application.
 *
 * @property array params The command line arguments. It does not include the entry script name.
 *
 * @author Ihor Skliar
 * @author Vladimir Kozhin
 *
 * @class Jii.console.Request
 * @extends Jii.base.Request
 */
var Request = Jii.defineClass('Jii.console.Request', /** @lends Jii.console.Request.prototype */{

    __extends: BaseRequest,

    /**
     * Resolves the current request into a route and the associated parameters.
     * @returns {[]} the first element is the route, and the second is the associated parameters.
     */
    resolve() {
        var route = process.argv[2] || '';
        var params = this.getParams();

        var ConsoleApplication = require('../application/ConsoleApplication');
        delete params[ConsoleApplication.OPTION_APPCONFIG];

        return [route, params];
    },

    _parseParams() {
        var params = minimist(process.argv.slice(3));

        var arrParams = params._;
        delete params._;
        _each(arrParams, (value, i) => {
            params[i] = value;
        });

        return params;
    }

});

module.exports = Request;