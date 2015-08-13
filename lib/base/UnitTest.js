/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

/**
 * @namespace Jii
 * @ignore
 */
var Jii = require('../Jii');

require('./Object');

/**
 * @class Jii.base.UnitTest
 * @extends Jii.base.Object
 */
Jii.defineClass('Jii.base.UnitTest', /** @lends Jii.base.UnitTest.prototype */{

	__extends: Jii.base.Object,

	__static: /** @lends Jii.base.UnitTest */{

		/**
		 *
		 * @param time In seconds
		 * @returns {Promise}
		 */
		waitDeferred: function (time) {
			new Promise(function(resolve) {
				setTimeout(function () {
					resolve();
				}, time * 1000);
			});
		}

	},

	setUp: function () {
		if (process.env.NODE_ENV === 'production') {
			throw new Jii.exceptions.ApplicationException('Do not run unit tests in production!');
		}

		// Remove all data from redis
		if (Jii.app && Jii.app.redis) {
			Jii.app.redis.flushall(function () {
			});
		} else {
		}

		return Promise.resolve();
	},

	tearDown: function() {
		// @todo
		//Jii.app.redis && Jii.app.redis.end();
		//Jii.app.db && Jii.app.db.close();
		//Jii.app.comet && Jii.app.comet.end();

		return Promise.resolve();
	},

	/**
	 *
	 * @param {object} [config]
	 * @param {string} [appClassName]
	 */
	mockApplication: function(config, appClassName) {
		config = config || {};
		appClassName = appClassName || 'Jii.application.WebApplication';

		var defaultConfig = {
			application: {
				id: 'testapp',
				basePath: __dirname
			}
		};

		config = Jii._.extend(defaultConfig, config);
		Jii.createApplication(appClassName, config);
	},

	/**
	 *
	 */
	destroyApplication: function() {
		Jii.app = null;
	},

	exports: function () {
		// Base functions
		var result = {
			setUp: function(callback) {
				Promise.resolve()
					.then(function() {
						return this.setUp();
					}.bind(this))
					.then(function() {
						callback();
					})
					.catch(function(e) {
						setTimeout(function() {
							throw e;
						});
						return Promise.reject();
					});
			}.bind(this),
			tearDown: function(callback) {
				Promise.resolve()
					.then(this.tearDown())
					.then(function() {
						callback();
					})
					.catch(function(e) {
						setTimeout(function() {
							throw e;
						});
						return Promise.reject();
					});
			}.bind(this)
		};

		// Append test functions
		for (var key in this) {
			if (Jii._.isFunction(this[key]) && (key.substr(-4, 4) === 'Test' || key.substr(0, 4) === 'test')) {
				result[key] = Jii._.bind(this[key], this);
			}
		}

		return result;
	}

});
