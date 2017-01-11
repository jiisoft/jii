/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */

'use strict';

const Jii = require('../BaseJii');
const BaseObject = require('../base/BaseObject');

class IRenderer extends BaseObject {

    /**
     *
     * @param {*} view
     * @param {Context} context
     * @param {object} params
     * @param {Controller} controller
     * @param {WebView} webView
     * @returns {*}
     */
    render(view, context, params, controller, webView) {
    }

    /**
     *
     * @param {*} view
     * @param {Context} context
     * @param {object} params
     * @param {Controller} controller
     * @param {WebView} webView
     * @returns {*}
     */
    renderLayout(view, context, params, controller, webView) {
    }

}
module.exports = IRenderer;