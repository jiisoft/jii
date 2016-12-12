/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */
'use strict';

var Jii = require('../BaseJii');
var Action = require('../base/Action');
class InlineAction extends Action {

    preInit(id, controller, actionMethod, config) {
        /**
     * @type {string} the controller method that  this inline action is associated with
     */
        this.actionMethod = actionMethod;
        super.preInit(id, controller, config);
    }

    /**
     * Runs this action with the specified parameters.
     * This method is mainly invoked by the controller.
     * @param {Jii.base.Context} context
     * @returns {*} the result of the action
     */
    runWithParams(context) {
        return Promise.resolve().then(() => {
            return this.controller[this.actionMethod].call(this.controller, context);
        });
    }

}
module.exports = InlineAction;