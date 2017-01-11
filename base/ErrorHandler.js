/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */

'use strict';

const Jii = require('../BaseJii');
const Component = require('./Component');

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