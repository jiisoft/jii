/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */
'use strict';

var Jii = require('../BaseJii');
var BaseObject = require('../base/Object');
class String extends BaseObject {

    /**
         * Generate unique hash for string. http://jsperf.com/hashcodelordvlad
         * @param {String} str
         * @returns {String}
         */
    static hashCode(str) {
        return str.split('').reduce((a, b) => {
            a = (a << 5) - a + b.charCodeAt(0);
            return a & a;
        }, 0).toString().replace(/-/g, '1');
    }

    static generateUid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            var r = Math.random() * 16 | 0;
            var v = c == 'x' ? r : r & 3 | 8;

            return v.toString(16);
        });
    }

}
module.exports = String;