/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

const Jii = require('../BaseJii');
const Event = require('../base/Event');

class MissingTranslationEvent extends Event {

    preInit() {
        /**
         * @var string the language ID (e.g. en-US) that the message is to be translated to
         */
        this.language = null;

        /**
         * @var string the category that the message belongs to
         */
        this.category = null;

        /**
         * @var string the translated message. An event handler may overwrite this property
         * with a translated version of [[message]] if possible. If not set (null), it means the message is not translated.
         */
        this.translatedMessage = null;

        /**
         * @var string the message to be translated. An event handler may use this to provide a fallback translation
         * and set [[translatedMessage]] if possible.
         */
        this.message = null;

        super.preInit(...arguments);
    }

}
module.exports = MissingTranslationEvent;