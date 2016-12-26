/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

var Jii = require('../../BaseJii');
var InvalidParamException = require('../../exceptions/InvalidParamException');
var Action = require('../../base/Action');
var Command = require('./Command');

class ActiveRecordAction extends Action {

    /**
     * Runs this action with the specified parameters.
     * This method is mainly invoked by the controller.
     * @param {Jii.base.Context} context
     * @returns {*} the result of the action
     */
    runWithParams(context) {
        /** @type {Jii.data.ActiveRecord} modelClass */
        var modelClass = Jii.namespace(context.request.get('modelClassName'));

        switch (context.request.get('method')) {
            case Command.METHOD_INSERT:
                var model = new modelClass();
                model.setAttributes(context.request.get('values'));
                return model.save().then(success => {
                    return {
                        attributes: success ? model.getAttributes() : null,
                        errors: model.getErrors()
                    };
                });

            case Command.METHOD_UPDATE:
                return modelClass.findOne(context.request.get('primaryKey')).then(model => {
                    if (!model) {
                        return {
                            success: false,
                            errors: {}
                        };
                    }

                    model.setAttributes(context.request.get('values'));
                    return model.save().then(success => {
                        return {
                            success: success,
                            errors: model.getErrors()
                        };
                    });
                });

            case Command.METHOD_DELETE:
                return modelClass.findOne(context.request.get('primaryKey')).then(model => {
                    return model ? model.delete() : false;
                }).then(success => {
                    return {
                        success: success
                    };
                });
        }

        throw new InvalidParamException('Unknown method `' + context.request.get('method') + '` in ' + this.className());
    }

}
module.exports = ActiveRecordAction;