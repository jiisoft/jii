/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */

'use strict';

var Jii = require('../BaseJii');
var _values = require('lodash/values');
var _each = require('lodash/each');
var WebView = require('./WebView');

/**
 * ViewEvent represents events triggered by the [[View]] component.
 *
 * @class Jii.view.ServerWebView
 * @extends Jii.view.WebView
 */
var ServerWebView = Jii.defineClass('Jii.view.ServerWebView', /** @lends Jii.view.ServerWebView.prototype */{

    __extends: WebView,

    /**
     *
     * @param {*} view
     * @param {Jii.base.Context} context
     * @param {object} params
     * @param {Jii.base.Controller} controller
     * @returns {Promise}
     */
    renderLayout(view, context, params, controller) {
        return this.__super(view, context, params, controller).then(content => {

            content = content.replace(this.__static.PH_HEAD, this._renderHeadHtml());
            content = content.replace(this.__static.PH_BODY_BEGIN, this._renderBodyBeginHtml());
            content = content.replace(this.__static.PH_BODY_END, this._renderBodyEndHtml());
            this.clear();

            return Promise.resolve(content);
        });
    },

    /**
     * Marks the position of an HTML head section.
     */
    head() {
        return this.__static.PH_HEAD;
    },

    /**
     * Marks the beginning of an HTML body section.
     */
    beginBody() {
        return this.__static.PH_BODY_BEGIN;
    },

    /**
     * Marks the ending of an HTML body section.
     */
    endBody() {
        return this.__static.PH_BODY_END;
    },

    /**
     * Clears up the registered meta tags, link tags, css/js scripts and files.
     */
    clear() {
        this.metaTags = {};
        this.linkTags = {};
        this.css = {};
        this.cssFiles = {};
        this.js = {};
        this.jsFiles = {};

        this.__super();
    },

    /**
     * Renders the content to be inserted in the head section.
     * The content is rendered using the registered meta tags, link tags, CSS/JS code blocks and files.
     * @returns {string} the rendered content
     */
    _renderHeadHtml() {
        return [].concat(
            _values(this.metaTags),
            _values(this.linkTags),
            _values(this.cssFiles),
            _values(this.css),
            _values(this.jsFiles[WebView.POS_HEAD]),
            _values(this.js[WebView.POS_HEAD])
        ).join('\n');
    },

    /**
     * Renders the content to be inserted at the beginning of the body section.
     * The content is rendered using the registered JS code blocks and files.
     * @returns {string} the rendered content
     */
    _renderBodyBeginHtml() {
        return [].concat(
            _values(this.jsFiles[WebView.POS_BEGIN]),
            _values(this.js[WebView.POS_BEGIN])
        ).join('\n');
    },

    /**
     * Renders the content to be inserted at the end of the body section.
     * The content is rendered using the registered JS code blocks and files.
     * @returns {string} the rendered content
     */
    _renderBodyEndHtml() {
        return [].concat(
            _values(this.jsFiles[WebView.POS_END]),
            _values(this.js[WebView.POS_END]),
            _values(this.js[WebView.POS_READY]),
            _values(this.js[WebView.POS_LOAD])
        ).join('\n');
    },

    _registerMetaTagInternal(key, options) {
        return '<meta' + this._renderTagAttributes(options) + ' />';
    },

    _registerLinkTagInternal(key, options) {
        return '<link' + this._renderTagAttributes(options) + ' />';
    },

    _registerCssInternal(key, code, options) {
        return '<style' + this._renderTagAttributes(options) + '>' + code + '</style>';
    },

    _registerCssFileInternal(key, condition, noscript, options) {
        var html = '<link' + this._renderTagAttributes(options) + '>';
        if (condition) {
            html = '<!--[if ' + condition + ']>\n' + html + '\n<![endif]-->';
        } else if (noscript) {
            html = '<noscript>' + html + '</noscript>';
        }
        return html;
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

        return '<script type="text/javascript">' + code + '</script>';
    },

    _registerJsFileInternal(key, position, condition, options) {
        var code = '<script' + this._renderTagAttributes(options) + '></script>';
        if (condition) {
            code = '<!--[if ' + condition + ']>\n' + code + '\n<![endif]-->';
        }
        return code;
    },

    _renderTagAttributes(options) {
        options = options || {};

        var attributes = '';
        _each(options, (value, key) => {
            attributes += ' ' + key + '="' + value + '"';
        });

        return attributes;
    }

});

module.exports = ServerWebView;