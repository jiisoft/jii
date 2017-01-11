/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */

'use strict';

const Jii = require('../BaseJii');

class ModelAdapterInterface {

    preInit() {
        /**
         * @type {object|string[]|null}
         */
        this.attributes = null;
    }

    /**
     *
     * @param {Model} original
     */
    instance(original) {
    }

    /**
     *
     * @param {Model} original
     * @param {*} proxy
     * @param {object} values
     */
    setValues(original, proxy, values) {
    }

}
module.exports = ModelAdapterInterface;