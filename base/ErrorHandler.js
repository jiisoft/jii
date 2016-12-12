/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */
'use strict';

var Jii = require('../BaseJii');
var Component = require('./Component');
class ErrorHandler extends Component {

    preInit() {
        /**
     * @type {*}
     */
        this.error = null;
        super.preInit(...arguments);
    }

}
module.exports = ErrorHandler;