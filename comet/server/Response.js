/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

const Jii = require('../../BaseJii');
const _isObject = require('lodash/isObject');
const BaseResponse = require('../../base/Response');

class Response extends BaseResponse {

    preInit() {
        /**
         * @type {*}
         */
        this.data = {};

        /**
         * @type {string}
         */
        this.requestUid = null;

        /**
         * @type {number|string}
         */
        this.connectionId = null;

        /**
         * @type {HubServer}
         */
        this.comet = null;

        super.preInit(...arguments);
    }

    /**
     *
     * @param {*} [data]
     */
    send(data) {
        data = data || this.data;
        if (_isObject(data)) {
            data.requestUid = this.requestUid;
        }

        this.comet.sendToConnection(this.connectionId, 'action ' + JSON.stringify(data));
    }

}
module.exports = Response;