/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */

'use strict';

var Jii = require('../BaseJii');
var BaseObject = require('../base/Object');

class IRenderer extends BaseObject {

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
    }

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

}
module.exports = IRenderer;