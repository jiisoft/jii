/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */

'use strict';

const Jii = require('../../BaseJii');
const Request = require('./Request');
const Response = require('./Response');
const InvalidRouteException = require('../../exceptions/InvalidRouteException');
const _isString = require('lodash/isString');
const _each = require('lodash/each');
const _extend = require('lodash/extend');
const Component = require('../../base/Component');
const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');

class HttpServer extends Component {

    preInit() {
        this._isExpressSubscribed = false;
        this._server = null;
        this._express = null;

        /**
         * @type {string|string[]|object}
         */
        this.staticDirs = null;

        /**
         * @type {Jii.request.UrlManager|string}
         */
        this.urlManager = 'urlManager';

        this.port = 3000;

        this.host = '0.0.0.0';

        super.preInit(...arguments);
    }

    init() {
        this._express = new express();
        this._express.use(bodyParser.json());
        // for parsing application/json
        this._express.use(bodyParser.urlencoded({
            extended: true
        }));
        // for parsing application/x-www-form-urlencoded
        this._express.use(multer());
        // for parsing multipart/form-data

        // Static files
        if (_isString(this.staticDirs)) {
            this.staticDirs = [this.staticDirs];
        }
        _each(this.staticDirs || [], dir => {
            this._express.use(express.static(dir));
        });

        if (_isString(this.urlManager)) {
            this.urlManager = Jii.app.getComponent(this.urlManager);
        }
    }

    /**
     * Start listen http queries
     */
    start() {
        // Subscribe on all requests
        if (!this._isExpressSubscribed) {
            this._isExpressSubscribed = true;
            this._express.all('*', this._onRoute.bind(this));
        }

        Jii.info('Start http server, listening `' + this.host + ':' + this.port + '`.');
        this._server = http.createServer(this._express).listen(this.port, this.host);
    }

    /**
     * Stop listen http port
     */
    stop(c) {
        this._server.close(c);
        Jii.info('Http server is stopped.');
    }

    /**
     * @param {object} expressRequest
     * @param {object} expressResponse
     * @private
     */
    _onRoute(expressRequest, expressResponse) {
        var request = new Request(expressRequest);
        var result = this.urlManager.parseRequest(request);
        if (result !== false) {
            var route = result[0];
            var params = result[1];

            // Append parsed params to request
            var queryParams = request.getQueryParams();
            request.setQueryParams(_extend(queryParams, params));

            // Create response component
            var response = new Response(expressResponse);

            // Create context
            var context = Jii.createContext({
                route: route
            });
            context.setComponent('request', request);
            context.setComponent('response', response);

            Jii.app.runAction(route, context);
            return;
        }

        //throw new InvalidRouteException(Jii.t('jii', 'Page not found.'));
        Jii.info('Page not found.');
    }

}
module.exports = HttpServer;