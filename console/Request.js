/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

var Jii = require('../index');
var _each = require('lodash/each');
var BaseRequest = require('../base/Request');
var minimist = require('minimist');

class Request extends BaseRequest {

    /**
     * Resolves the current request into a route and the associated parameters.
     * @returns {[]} the first element is the route, and the second is the associated parameters.
     */
    resolve() {
        var route = process.argv[2] || '';
        var params = this.getParams();

        var ConsoleApplication = require('../application/ConsoleApplication');
        delete params[ConsoleApplication.OPTION_APPCONFIG];

        return [
            route,
            params
        ];
    }

    _parseParams() {
        var params = minimist(process.argv.slice(3));

        var arrParams = params._;
        delete params._;
        _each(arrParams, (value, i) => {
            params[i] = value;
        });

        return params;
    }

}
module.exports = Request;