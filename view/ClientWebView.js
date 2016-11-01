/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */

'use strict';

var Jii = require('../BaseJii');
var WebView = require('./WebView');

/**
 * ViewEvent represents events triggered by the [[View]] component.
 *
 * @class Jii.view.ClientWebView
 * @extends Jii.view.WebView
 */
var ClientWebView = Jii.defineClass('Jii.view.ClientWebView', /** @lends Jii.view.ClientWebView.prototype */{

    __extends: WebView,

    _registerMetaTagInternal(key, options) {
        return this._findByKey(key) || this._createTag('meta', WebView.POS_HEAD, '', options);
    },

    _registerLinkTagInternal(key, options) {
        return this._findByKey(key) || this._createTag('link', WebView.POS_HEAD, '', options);
    },

    _registerCssInternal(key, code, options) {
        return this._findByKey(key) || this._createTag('style', WebView.POS_HEAD, code, options);
    },

    _registerCssFileInternal(key, condition, noscript, options) {
        if (!this._isCurrentBrowser(condition)) {
            return true;
        }

        return this._findByKey(key) || this._createTag('link', WebView.POS_HEAD, '', options);
    },

    _registerJsInternal(key, position, code, options) {
        switch (position) {
            case WebView.POS_READY:
                code = "jQuery(document).ready(function () {\n" + code + "\n});";
                break;

            case WebView.POS_LOAD:
                code = "jQuery(window).load(function () {\n" + code + "\n});";
                break;
        }

        return this._findByKey(key) || this._createTag('script', WebView.position, code, options);
    },

    _registerJsFileInternal(key, position, condition, options) {
        if (!this._isCurrentBrowser(condition)) {
            return true;
        }

        return this._findByKey(key) || this._createTag('script', WebView.position, '', options);
    },

    _findByKey(key) {
        return jQuery('[' + WebView.DATA_KEY_NAME + '="' + key + '"]').length > 0;
    },

    _createTag(name, position, content, options) {
        var $el = jQuery('<' + name + ' />', options)
            .html(content);

        switch (position) {
            case WebView.POS_HEAD:
                $el.appendTo(document.head);
                break;

            case WebView.POS_BEGIN:
                $el.prependTo(document.body); // @todo Insert before app, need for true sort
                break;

            case WebView.POS_END:
            case WebView.POS_READY:
            case WebView.POS_LOAD:
                $el.appendTo(document.body);
                break;
        }
    },

    _isCurrentBrowser(condition) {
        return false; // @todo
    }

});

module.exports = ClientWebView;