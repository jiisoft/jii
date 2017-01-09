/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

const Jii = require('../BaseJii');
const Component = require('../base/Component');
const MissingTranslationEvent = require('./MissingTranslationEvent');

class MessageSource extends Component {

    preInit() {
        this._messages = {};

        /**
         * the language that the original messages are in. If not set, it will use the value of [[Jii.base.Application.sourceLanguage]]
         * @type string|null
         */
        this.sourceLanguage = null;

        /**
         * whether to force message translation when the source and target languages are the same.
         * Defaults to false, meaning translation is only performed when source and target languages are different
         * @type boolean
         */
        this.forceTranslation = false;

        super.preInit(...arguments);
    }

    init() {
        super.init();

        if (this.sourceLanguage === null) {
            this.sourceLanguage = Jii.app.sourceLanguage;
        }
    }

    /**
     * Translates a message to the specified language.
     *
     * Note that unless [[forceTranslation]] is true, if the target language
     * is the same as the [[sourceLanguage|source language]], the message
     * will NOT be translated.
     *
     * If a translation is not found, a [[EVENT_MISSING_TRANSLATION|missingTranslation]] event will be triggered.
     *
     * @param {string} category the message category
     * @param {string} message the message to be translated
     * @param {string} language the target language
     * @return {string|boolean} the translated message or false if translation wasn't found or isn't required
     */
    translate(category, message, language) {
        if (this.forceTranslation || language !== this.sourceLanguage) {
            return this._translateMessage(category, message, language);
        } else {
            return false;
        }
    }

    /**
     *
     * @param {object} value
     */
    setMessages(value) {
        this._messages = value;
    }

    /**
     * Loads the message translation for the specified language and category.
     * If translation for specific locale code such as `en-US` isn't found it
     * tries more generic `en`.
     *
     * @param {string} category the message category
     * @param {string} language the target language
     * @return {object} the loaded messages. The keys are original messages, and the values
     * are translated messages.
     */
    _loadMessages(category, language) {
        return [];
    }

    /**
     * Translates the specified message.
     * If the message is not found, a [[EVENT_MISSING_TRANSLATION|missingTranslation]] event will be triggered.
     * If there is an event handler, it may provide a [[MissingTranslationEvent::translatedMessage|fallback translation]].
     * If no fallback translation is provided this method will return `false`.
     * @param {string} category the category that the message belongs to.
     * @param {string} message the message to be translated.
     * @param {string} language the target language.
     * @return {string|boolean} the translated message or false if translation wasn't found.
     */
    _translateMessage(category, message, language) {
        let key = `${ language }/${ category }`;

        if (!this._messages[key]) {
            this._messages[key] = this._loadMessages(category, language);
        }

        if (this._messages[key] && this._messages[key][message]) {
            return this._messages[key][message];
        } else if (this.hasEventHandlers(MessageSource.EVENT_MISSING_TRANSLATION)) {
            const event = new MissingTranslationEvent({
                category: category,
                message: message,
                language: language
            });
            this.trigger(MessageSource.EVENT_MISSING_TRANSLATION, event);

            if (event.translatedMessage !== null) {
                this._messages[key][message] = event.translatedMessage;
                return this._messages[key][message];
            }
        }

        this._messages[key][message] = false;
        return this._messages[key][message];
    }

}

/**
 * @event Jii.i18n.MessageSource#change
 * @property {Jii.i18n.MissingTranslationEvent} event
 */
MessageSource.EVENT_MISSING_TRANSLATION = 'missingTranslation';
module.exports = MessageSource;