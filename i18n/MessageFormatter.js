/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

var Jii = require('../BaseJii');
var Component = require('../base/Component');
var IntlMessageFormat = require('intl-messageformat');

class MessageFormatter extends Component {

    preInit() {
        this._errorMessage = '';

        super.preInit(...arguments);
    }

    /**
     * Get the error text from the last operation
     * @return {string} Description of the last error.
     */
    getErrorMessage() {
        return this._errorMessage;
    }

    /**
     * Formats a message via [ICU message format](http://userguide.icu-project.org/formatparse/messages)
     *
     * @param {string} pattern The pattern string to insert parameters into.
     * @param {object} params The array of name value pairs to insert into the format string.
     * @param {string} language The locale to use for formatting locale-dependent parts
     * @return {string|boolean} The formatted pattern string or `FALSE` if an error occurred
     */
    format(pattern, params, language) {
        const formatter = new IntlMessageFormat(pattern, language);
        let output = false;

        try {
            output = formatter.format(params);
        } catch (e) {
            this._errorMessage = String(e);
        }

        return output;
    }

}
module.exports = MessageFormatter;