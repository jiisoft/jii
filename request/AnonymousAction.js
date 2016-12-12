/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */
'use strict';

var Jii = require('../BaseJii');
var Action = require('../base/Action');
class AnonymousAction extends Action {

    preInit(route, module, handler, config) {
        /**
     * @type {string} the controller method that  this inline action is associated with
     */
        this.route = route;
        /**
     * @type {function}
     */
        this.handler = handler;
        /**
     * @type {Jii.base.Module}
     */
        this.module = module;

        var id = route.split('/').pop();
        super.preInit(id, null, config);
    }

    /**
     * Returns the unique ID of this action among the whole application.
     * @returns {string} the unique ID of this action among the whole application.
     */
    getUniqueId() {
        return this.route;
    }

    /**
     * Runs this action with the specified parameters.
     * This method is mainly invoked by the controller.
     * @param {Jii.base.Context} context
     * @returns {*} the result of the action
     */
    runWithParams(context) {
        return Promise.resolve().then(() => {
            return this.handler.call(this.module, context);
        });
    }

}
module.exports = AnonymousAction;