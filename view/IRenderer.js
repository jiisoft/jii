/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */

'use strict';

var Jii = require('../BaseJii');
var Object = require('../base/Object');

/**
 * ViewEvent represents events triggered by the [[View]] component.
 *
 * @class Jii.view.IRenderer
 * @extends Jii.base.Object
 */
var IRenderer = Jii.defineClass('Jii.view.IRenderer', /** @lends Jii.view.IRenderer.prototype */{

    __extends: Object,

    /**
     *
     * @param {*} view
     * @param {Jii.base.Context} context
     * @param {object} params
     * @param {Jii.base.Controller} controller
     * @param {Jii.view.WebView} webView
     * @returns {*}
     */
    render(view, context, params, controller, webView) {
    },

    /**
     *
     * @param {*} view
     * @param {Jii.base.Context} context
     * @param {object} params
     * @param {Jii.base.Controller} controller
     * @param {Jii.view.WebView} webView
     * @returns {*}
     */
    renderLayout(view, context, params, controller, webView) {
    }

});

module.exports = IRenderer;