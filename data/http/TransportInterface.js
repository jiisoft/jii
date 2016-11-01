'use strict';

var Jii = require('../../BaseJii');
var Component = require('../../base/Component');

/**
 * @class Jii.data.http.TransportInterface
 * @interface Jii.data.http.TransportInterface
 * @extends Jii.base.Component
 */
var TransportInterface = Jii.defineClass('Jii.data.http.TransportInterface', /** @lends Jii.data.http.TransportInterface.prototype */{

	__extends: Component,

    /**
     * Send request to backend
     * @param {string} route
     * @param {object} [params]
     * @returns {Promise}
     */
	request(route, params) {
	}

});

module.exports = TransportInterface;