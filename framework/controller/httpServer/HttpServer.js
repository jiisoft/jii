/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */

'use strict';

var http = require('http');
var express = require('express');

/**
 * @class Jii.controller.httpServer.HttpServer
 * @extends Jii.base.Component
 */
Jii.defineClass('Jii.controller.httpServer.HttpServer', {
	
	__extends: Jii.base.Component,

    host: '0.0.0.0',
    port: 3000,

    /**
     * @type {Jii.controller.UrlManager|string}
     */
    urlManager: 'urlManager',

    _express: null,
    _server: null,

    init: function () {
        this._express = new express();
        //this._express.use(express.json());
        //this._express.use(express.urlencoded());

        // Subscribe on all requests
        this._express.all('*', this._onRoute.bind(this));

        if (_.isString(this.urlManager)) {
            this.urlManager = Jii.app.getComponent(this.urlManager);
        }
    },

    /**
     * Start listen http queries
     */
    start: function () {
        //Jii.app.logger.info('Start http server, listening `%s`.', this.host + ':' + this.port);
        this._server = http.createServer(this._express).listen(this.port, this.host);
    },

    /**
     * Stop listen http port
     */
    stop: function (c) {
        this._server.close(c);
        //Jii.app.logger.info('Http server is stopped.');
    },

    /**
     * @param {object} expressRequest
     * @param {object} expressResponse
     * @private
     */
    _onRoute: function (expressRequest, expressResponse) {
        var request = new Jii.controller.httpServer.Request(expressRequest);
        var result = this.urlManager.parseRequest(request);
        if (result !== false) {
            var route = result[0];
            var params = result[1];

            // Append parsed params to request
            var queryParams = request.getQueryParams();
            request.setQueryParams(_.extend(queryParams, params));

			// Create response component
			var response = new Jii.controller.httpServer.Response(expressResponse);

			// Create context
			var context = Jii.createContext();
			context.setComponent('request', request);
			context.setComponent('response', response);

            Jii.app.runAction(route, context);
            return;
        }

        //throw new Jii.exceptions.InvalidRouteException(Jii.t('jii', 'Page not found.'));
        //Jii.app.logger.info('Page not found.');
    }
});
