/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */

'use strict';

const Jii = require('../BaseJii');

class CollectionAdapterInterface {

    /**
     *
     * @param {Collection} original
     */
    instance(original) {
    }

    /**
     *
     * @param {Collection} original
     * @param {*} cloned
     * @param {Model[]} models
     */
    add(original, cloned, models) {
    }

    /**
     *
     * @param {Collection} original
     * @param {*} cloned
     * @param {Model[]} models
     */
    remove(original, cloned, models) {
    }

}
module.exports = CollectionAdapterInterface;