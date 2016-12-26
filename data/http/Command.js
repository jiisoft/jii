/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

var Jii = require('../../BaseJii');
var _isEmpty = require('lodash/isEmpty');
var Component = require('../../base/Component');

class Command extends Component {

    preInit() {
        /**
         * @type {Jii.data.BaseConnection} the DB connection that this command is associated with
         */
        this.db = null;

        super.preInit(...arguments);
    }

    /**
     * @returns {Promise}
     */
    queryAll() {
        return this._queryInternal('all');
    }

    /**
     * @returns {Promise}
     */
    queryOne() {
        return this._queryInternal('one');
    }

    /**
     * @returns {Promise}
     */
    queryScalar() {
        return this._queryInternal('scalar');
    }

    /**
     * @returns {Promise}
     */
    queryColumn() {
        return this._queryInternal('column');
    }

    /**
     * Performs the actual DB query of a SQL statement.
     * @param {string} method
     * @returns {Promise} the method execution result
     * @throws Exception if the query causes any problem
     */
    _queryInternal(method) {
    }

    /**
     *
     * @param {Jii.data.ActiveRecord} model
     * @param {object} values
     * @returns {Promise}
     */
    insertModel(model, values) {
        return this.db.exec(this.constructor.METHOD_INSERT, model.className(), {
            values: values
        }).then(result => {
            if (!result) {
                return null;
            }

            if (!_isEmpty(result.errors)) {
                model.setErrors(result.errors);
                return null;
            }
            if (result.attributes) {
                model.setAttributes(result.attributes);
            }

            return {
                insertId: model.getPrimaryKey()
            };
        });
    }

    /**
     *
     * @param {Jii.data.BaseActiveRecord} model
     * @param {object} values
     * @returns {Promise}
     */
    updateModel(model, values) {
        return this.db.exec(this.constructor.METHOD_UPDATE, model.className(), {
            primaryKey: model.getOldPrimaryKey(true),
            values: values
        }).then(result => {
            if (!result) {
                return 0;
            }

            if (!_isEmpty(result.errors)) {
                model.setErrors(result.errors);
                return 0;
            }

            return result.success ? 1 : 0;
        });
    }

    /**
     *
     * @param {Jii.data.BaseActiveRecord} model
     * @returns {Promise}
     */
    deleteModel(model) {
        return this.db.exec(this.constructor.METHOD_DELETE, model.className(), {
            primaryKey: model.getOldPrimaryKey(true)
        }).then(result => {
            return result && result.success ? 1 : 0;
        });
    }

}
Command.METHOD_DELETE = 'delete';
Command.METHOD_UPDATE = 'update';

Command.METHOD_INSERT = 'insert';
module.exports = Command;