/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */
'use strict';

var Jii = require('../BaseJii');
var WebApplication = require('../application/WebApplication');
var ApplicationException = require('../exceptions/ApplicationException');
var _isFunction = require('lodash/isFunction');
var _extend = require('lodash/extend');
var BaseObject = require('./../base/Object');
class UnitTest extends BaseObject {

    /**
         *
         * @param time In seconds
         * @returns {Promise}
         */
    static waitDeferred(time) {
        new Promise(resolve => {
            setTimeout(() => {
                resolve();
            }, time * 1000);
        });
    }

    setUp() {
        if (process.env.NODE_ENV === 'production') {
            throw new ApplicationException('Do not run unit tests in production!');
        }

        // Remove all data from redis
        if (Jii.app && Jii.app.redis) {
            Jii.app.redis.flushall(() => {
            });
        } else {
        }

        return Promise.resolve();
    }

    tearDown() {
        // @todo
        //Jii.app.redis && Jii.app.redis.end();
        //Jii.app.db && Jii.app.db.close();
        //Jii.app.comet && Jii.app.comet.end();

        return Promise.resolve();
    }

    /**
     *
     * @param {object} [config]
     * @param {string} [appClassName]
     */
    mockApplication(config, appClassName) {
        config = config || {};
        appClassName = appClassName || WebApplication;

        var defaultConfig = {
            application: {
                id: 'testapp',
                basePath: __dirname
            }
        };

        config = _extend(defaultConfig, config);
        Jii.createApplication(appClassName, config);
    }

    /**
     *
     */
    destroyApplication() {
        Jii.app = null;
    }

    exports() {
        // Base functions
        var result = {
            setUp: callback => {
                Promise.resolve().then(() => {
                    return this.setUp();
                }).then(() => {
                    callback();
                }).catch(e => {
                    Jii.catchHandler(e);
                    return Promise.reject();
                });
            },
            tearDown: callback => {
                Promise.resolve().then(this.tearDown()).then(() => {
                    callback();
                }).catch(e => {
                    Jii.catchHandler(e);
                    return Promise.reject();
                });
            }
        };

        // Append test functions
        for (let key of Object.getOwnPropertyNames(Object.getPrototypeOf(this))) {
            if (_isFunction(this[key]) && (key.substr(-4, 4) === 'Test' || key.substr(0, 4) === 'test')) {
                result[key] = this[key].bind(this);
            }
        }

        return result;
    }

}
module.exports = UnitTest;