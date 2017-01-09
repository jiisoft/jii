/**
 * @author
 * @license MIT
 */
'use strict';

var Jii = require('../BaseJii');
var Component = require('../base/Component');
var InvalidParamException = require('jii/exceptions/InvalidParamException');
var _upperFirst = require('lodash/upperFirst');
var _clone = require('lodash/clone');

class Formatter extends Component {

    preInit() {

        /** @var string the locale ID that is used to localize the date and number formatting. */
        this.locale = Jii.app.language;

        /** @var string the text to be displayed when formatting a `null` value.
         * Defaults to `'<span class="not-set">(not set)</span>'`, where `(not set)`
         * will be translated according to [[locale]] */
        this.nullDisplay = '<span class="not-set">' + Jii.t('jii', '(not set)', [], this.locale) + '</span>';

        /** @var array the text to be displayed when formatting a boolean value. The first element corresponds
         * to the text displayed for `false`, the second element for `true`.
         * Defaults to `['No', 'Yes']`, where `Yes` and `No`
         * will be translated according to [[locale]]. */
        this.booleanFormat = [Jii.t('jii', 'No', [], this.locale), Jii.t('jii', 'Yes', [], this.locale)];

        super.preInit(...arguments);
    }

    /**
     * Formats the value as a boolean.
     * @param {mixed} value the value to be formatted.
     * @return {string} the formatted result.
     * @see booleanFormat
     */
    asBoolean(value) {
        if (value === null) {
            return this.nullDisplay;
        }

        return value ? this.booleanFormat[1] : this.booleanFormat[0];
    }

    /**
     * Formats the value as is without any formatting.
     * This method simply returns back the parameter without any format.
     * The only exception is a `null` value which will be formatted using [[nullDisplay]].
     * @param {mixed} value the value to be formatted.
     * @return string the formatted result.
     */
    asRaw(value) {
        if (value === null) {
            return this.nullDisplay;
        }
        return value;
    }

    /**
     * Formats the value as an HTML-encoded plain text.
     * @param {string} value the value to be formatted.
     * @return string the formatted result.
     */
    asText(value) {
        if (value === null) {
            return this.nullDisplay;
        }
        return value;
    }



    /**
     * Formats the value as HTML text.
     * The value will be purified using [[HtmlPurifier]] to avoid XSS attacks.
     * Use [[asRaw()]] if you do not want any purification of the value.
     * @param {string} value the value to be formatted.
     * @param {object|null} config the configuration for the HTMLPurifier class.
     * @return XML the formatted result.
     */
    asHtml(value, config = null) {
        if (value === null) {
            return this.nullDisplay;
        }
        return <span dangerouslySetInnerHTML={{__html: value}}/>;
    }

    /**
     * Formats the value based on the given format type.
     * This method will call one of the "as" methods available in this class to do the formatting.
     * For type "xyz", the method "asXyz" will be used. For example, if the format is "html",
     * then [[asHtml()]] will be used. Format names are case insensitive.
     * @param {mixed} value the value to be formatted.
     * @param {string|object} format the format of the value, e.g., "html", "text". To specify additional
     * parameters of the formatting method, you may use an array. The first element of the array
     * specifies the format name, while the rest of the elements will be used as the parameters to the formatting
     * method. For example, a format of `['date', 'Y-m-d']` will cause the invocation of `asDate($value, 'Y-m-d')`.
     * @return string the formatting result.
     * @throws InvalidParamException if the format type is not supported by this class.
     */
    format(value, format) {
        let params;

        if (typeof(format) == 'object') {
            if (!format[0]) {
                throw new InvalidParamException('The format array must contain at least one element.');
            }
            const f = _clone(format[0]);
            format[0] = value;
            params = _clone(format);
            format = f;
        }
        else {
            params = [value];
        }
        const method = 'as' + _upperFirst(format);

        if (this[method]) {
            return this[method](...params);
        }
        else {
            throw new InvalidParamException("Unknown format type: " + format);
        }
    }

}
module.exports = Formatter;