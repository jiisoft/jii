/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

var Jii = require('../BaseJii');
var Object = require('../base/Object');

/**
 * @class Jii.comet.INeatContextProfiles
 * @extends Jii.base.Object
 */
var INeatContextProfiles = Jii.defineClass('Jii.comet.INeatContextProfiles', /** @lends Jii.comet.INeatContextProfiles.prototype */{

    __extends: Object,

    /**
     *
     * @param {string} name
     * @param {object} [params]
     */
    getCollection(name, params) {

    }

});

module.exports = INeatContextProfiles;