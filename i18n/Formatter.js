/**
 * @author
 * @license MIT
 */
'use strict';

var Jii = require('../BaseJii');
var Component = require('../base/Component');

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
    asBoolean(value)
    {
        if (value === null) {
            return this.nullDisplay;
        }

        return value ? this.booleanFormat[1] : this.booleanFormat[0];
    }

}
module.exports = Formatter;