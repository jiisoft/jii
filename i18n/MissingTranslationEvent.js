/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

var Jii = require('../BaseJii');
var Event = require('../base/Event');

/**
 * @class Jii.i18n.MissingTranslationEvent
 * @extends Jii.base.Event
 */
var MissingTranslationEvent = Jii.defineClass('Jii.i18n.MissingTranslationEvent', /** @lends Jii.i18n.MissingTranslationEvent.prototype */{

    __extends: Event,

    /**
     * @var string the message to be translated. An event handler may use this to provide a fallback translation
     * and set [[translatedMessage]] if possible.
     */
    message: null,

    /**
     * @var string the translated message. An event handler may overwrite this property
     * with a translated version of [[message]] if possible. If not set (null), it means the message is not translated.
     */
    translatedMessage: null,

    /**
     * @var string the category that the message belongs to
     */
    category: null,

    /**
     * @var string the language ID (e.g. en-US) that the message is to be translated to
     */
    language: null

});

module.exports = MissingTranslationEvent;