/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */
'use strict';

var Jii = require('../BaseJii');
var ChangeEvent = require('./ChangeEvent');
class ChangeAttributeEvent extends ChangeEvent {

    preInit() {
        /**
     * @type {boolean}
     */
        this.isRelation = false;
        /**
     * @type {*}
     */
        this.newValue = null;
        /**
     * @type {*}
     */
        this.oldValue = null;
        /**
     * @type {string}
     */
        this.attribute = '';
        super.preInit(...arguments);
    }

}
module.exports = ChangeAttributeEvent;