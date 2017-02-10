/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */

'use strict';

const Jii = require('../BaseJii');
const Expression = require('./Expression');
const InvalidConfigException = require('../exceptions/InvalidConfigException');
const _isEmpty = require('lodash/isEmpty');
const _each = require('lodash/each');
const _has = require('lodash/has');
const _keys = require('lodash/keys');
const _snakeCase = require('lodash/snakeCase');
const BaseActiveRecord = require('./BaseActiveRecord');

class ActiveRecord extends BaseActiveRecord {

    /**
     * Creates an [[ActiveQuery]] instance with a given SQL statement.
     *
     * Note that because the SQL statement is already specified, calling additional
     * query modification methods (such as `where()`, `order()`) on the created [[ActiveQuery]]
     * instance will have no effect. However, calling `with()`, `asArray()` or `indexBy()` is
     * still fine.
     *
     * Below is an example:
     *
     * ~~~
     * customers = Customer.findBySql('SELECT * FROM customer').all();
     * ~~~
     *
     * @param {string} sql the SQL statement to be executed
     * @param {[]} params parameters to be bound to the SQL statement during execution.
     * @returns {ActiveQuery} the newly created [[ActiveQuery]] instance
     */
    static findBySql(sql, params) {
        params = params || [];

        var query = this.find();
        query.setSql(sql);

        return query.params(params);
    }

    /**
     * Updates the whole table using the provided attribute values and conditions.
     * For example, to change the status to be 1 for all customers whose status is 2:
     *
     * ~~~
     * Customer.updateAll({status: 1}, 'status = 2');
     * ~~~
     *
     * @param {[]} attributes attribute values (name-value pairs) to be saved into the table
     * @param {string|[]} [condition] the conditions that will be put in the WHERE part of the UPDATE SQL.
     * Please refer to [[Query.where()]] on how to specify this parameter.
     * @param {object} [params] the parameters (name => value) to be bound to the query.
     * @returns {Promise.<number>} the number of rows updated
     */
    static updateAll(attributes, condition, params) {
        condition = condition || '';
        params = params || {};

        return this.getDb().createCommand().update(this.tableName(), attributes, condition, params);
    }

    /**
     * Updates the whole table using the provided counter changes and conditions.
     * For example, to increment all customers' age by 1,
     *
     * ~~~
     * Customer.updateAllCounters({age: 1});
     * ~~~
     *
     * @param {[]} counters the counters to be updated (attribute name => increment value).
     * Use negative values if you want to decrement the counters.
     * @param {string|[]} [condition] the conditions that will be put in the WHERE part of the UPDATE SQL.
     * Please refer to [[Query.where()]] on how to specify this parameter.
     * @param {object} [params] the parameters (name => value) to be bound to the query.
     * Do not name the parameters as `:bp0`, `:bp1`, etc., because they are used internally by this method.
     * @returns {number} the number of rows updated
     */
    static updateAllCounters(counters, condition, params) {
        condition = condition || '';
        params = params || {};

        let n = 0;
        _each(counters, (value, name) => {
            counters[name] = new Expression('[[' + name + ']]+:bp{' + n + '}', {
                [':bp{' + n + '}']: value
            });
            n++;
        });

        return this.getDb().createCommand().update(this.tableName(), counters, condition, params);
    }

    /**
     * Deletes rows in the table using the provided conditions.
     * WARNING: If you do not specify any condition, this method will delete ALL rows in the table.
     *
     * For example, to delete all customers whose status is 3:
     *
     * ~~~
     * Customer.deleteAll('status = 3');
     * ~~~
     *
     * @param {string|[]} [condition] the conditions that will be put in the WHERE part of the DELETE SQL.
     * Please refer to [[Query.where()]] on how to specify this parameter.
     * @param {object} [params] the parameters (name => value) to be bound to the query.
     * @returns {number} the number of rows deleted
     */
    static deleteAll(condition, params) {
        condition = condition || '';
        params = params || {};

        return this.getDb().createCommand().delete(this.tableName(), condition, params);
    }

    /**
     * @inheritdoc
     */
    static find() {
        const ActiveQuery = require('./ActiveQuery');
        return new ActiveQuery(this);
    }

    /**
     * Declares the name of the database table associated with this AR class.
     * By default this method returns the class name as the table name by calling [[Inflector.camel2id()]]
     * with prefix [[Connection.tablePrefix]]. For example if [[Connection.tablePrefix]] is 'tbl_',
     * 'Customer' becomes 'tbl_customer', and 'OrderItem' becomes 'tbl_order_item'. You may override this method
     * if the table is not named after this convention.
     * @returns {string} the table name
     */
    static tableName() {
        var className = this.className();
        var name = className.substr(className.lastIndexOf('.') + 1);

        return '{{%' + _snakeCase(name) + '}}';
    }

    /**
     * Returns the schema information of the DB table associated with this AR class.
     * @returns {TableSchema} the schema information of the DB table associated with this AR class.
     * @throws {InvalidConfigException} if the table for the AR class does not exist.
     */
    static getTableSchema() {
        var schema = this.getDb().getTableSchema(this.tableName());
        if (schema === null) {
            throw new InvalidConfigException('The table does not exist: ' + this.tableName());
        }

        return schema;
    }

    /**
     * Returns the primary key name(s) for this AR class.
     * The default implementation will return the primary key(s) as declared
     * in the DB table that is associated with this AR class.
     *
     * If the DB table does not declare any primary key, you should override
     * this method to return the attributes that you want to use as primary keys
     * for this AR class.
     *
     * Note that an array should be returned even for a table with single primary key.
     *
     * @returns {string[]} the primary keys of the associated database table.
     */
    static primaryKey() {
        return this.getTableSchema().primaryKey;
    }

    static populateRecord(record, row) {

        var columns = this.getTableSchema().columns;
        _each(row, (value, name) => {
            if (_has(columns, name)) {
                row[name] = columns[name].typecast(value);
            }
        });

        super.populateRecord(record, row);
    }

    /**
     * Loads default values from database table schema
     * @param {boolean} [skipIfSet] if existing value should be preserved
     */
    loadDefaultValues(skipIfSet) {
        skipIfSet = skipIfSet !== false;

        _each(this.constructor.getTableSchema().columns, column => {
            if (column.defaultValue !== null && (!skipIfSet || this.get(column.name) === null)) {
                this.set(column.name, column.defaultValue);
            }
        });
    }

    /**
     * Returns the list of all attribute names of the model.
     * The default implementation will return all column names of the table associated with this AR class.
     * @returns {[]} list of attribute names.
     */
    attributes() {
        return _keys(this.constructor.getTableSchema().columns);
    }

    /**
     * Inserts a row into the associated database table using the attribute values of this record.
     *
     * This method performs the following steps in order:
     *
     * 1. call [[beforeValidate()]] when `runValidation` is true. If validation
     *    fails, it will skip the rest of the steps;
     * 2. call [[afterValidate()]] when `runValidation` is true.
     * 3. call [[beforeSave()]]. If the method returns false, it will skip the
     *    rest of the steps;
     * 4. insert the record into database. If this fails, it will skip the rest of the steps;
     * 5. call [[afterSave()]];
     *
     * In the above step 1, 2, 3 and 5, events [[EVENT_BEFORE_VALIDATE]],
     * [[EVENT_BEFORE_INSERT]], [[EVENT_AFTER_INSERT]] and [[EVENT_AFTER_VALIDATE]]
     * will be raised by the corresponding methods.
     *
     * Only the [[dirtyAttributes|changed attribute values]] will be inserted into database.
     *
     * If the table's primary key is auto-incremental and is null during insertion,
     * it will be populated with the actual value after insertion.
     *
     * For example, to insert a customer record:
     *
     * ~~~
     * customer = new Customer();
     * customer.name = name;
     * customer.email = email;
     * customer.insert();
     * ~~~
     *
     * @param {boolean} runValidation whether to perform validation before saving the record.
     * If the validation fails, the record will not be inserted into the database.
     * @param {[]} attributes list of attributes that need to be saved. Defaults to null,
     * meaning all attributes that are loaded from DB will be saved.
     * @returns {boolean} whether the attributes are valid and the record is inserted successfully.
     * @throws \Exception in case insert failed.
     */
    insert(runValidation, attributes) {
        runValidation = runValidation !== false;
        attributes = attributes || null;

        return Promise.resolve().then(() => {
            if (runValidation) {
                return this.validate(attributes);
            }

            return true;
        }).then(isValidate => {
            if (!isValidate) {
                Jii.info('Model not inserted due to validation error.');
                return false;
            }

            /*var db = this.__static.getDb();
             if (this.isTransactional(self.OP_INSERT)) {
             transaction = db.beginTransaction();
             try {
             result = this.insertInternal(attributes);
             if (result === false) {
             transaction.rollBack();
             } else {
             transaction.commit();
             }
             } catch (\Exception e) {
             transaction.rollBack();
             throw e;
             }
             } else {*/
            return this._insertInternal(attributes); //}
        });
    }

    /**
     * Inserts an ActiveRecord into DB without considering transaction.
     * @param {[]} attributes list of attributes that need to be saved. Defaults to null,
     * meaning all attributes that are loaded from DB will be saved.
     * @returns {boolean} whether the record is inserted successfully.
     */
    _insertInternal(attributes) {
        attributes = attributes || null;

        return this.beforeSave(true).then(bool => {
            if (!bool) {
                return false;
            }

            var values = this.getDirtyAttributes(attributes);
            if (_isEmpty(values)) {
                _each(this.getPrimaryKey(true), (value, key) => {
                    values[key] = value;
                });
            }

            return this.constructor.getDb().createCommand().insertModel(this, values).then(insertInfo => {
                if (!insertInfo) {
                    return false;
                }

                var table = this.constructor.getTableSchema();
                if (table.sequenceName !== null) {
                    for (var i = 0, l = table.primaryKey.length; i < l; i++) {
                        var name = table.primaryKey[i];
                        if (this.getAttribute(name) === null) {
                            var id = table.columns[name].typecast(insertInfo.insertId);
                            this.setAttribute(name, id);
                            values[name] = id;
                            break;
                        }
                    }
                }

                var changedAttributes = {};
                _each(values, (num, key) => {
                    changedAttributes[key] = null;
                });
                this.setOldAttributes(values);
                return this.afterSave(true, changedAttributes).then(() => {
                    return true;
                });
            });
        });
    }

    /**
     * Saves the changes to this active record into the associated database table.
     *
     * This method performs the following steps in order:
     *
     * 1. call [[beforeValidate()]] when `runValidation` is true. If validation
     *    fails, it will skip the rest of the steps;
     * 2. call [[afterValidate()]] when `runValidation` is true.
     * 3. call [[beforeSave()]]. If the method returns false, it will skip the
     *    rest of the steps;
     * 4. save the record into database. If this fails, it will skip the rest of the steps;
     * 5. call [[afterSave()]];
     *
     * In the above step 1, 2, 3 and 5, events [[EVENT_BEFORE_VALIDATE]],
     * [[EVENT_BEFORE_UPDATE]], [[EVENT_AFTER_UPDATE]] and [[EVENT_AFTER_VALIDATE]]
     * will be raised by the corresponding methods.
     *
     * Only the [[dirtyAttributes|changed attribute values]] will be saved into database.
     *
     * For example, to update a customer record:
     *
     * ~~~
     * customer = Customer.findOne(id);
     * customer.name = name;
     * customer.email = email;
     * customer.update();
     * ~~~
     *
     * Note that it is possible the update does not affect any row in the table.
     * In this case, this method will return 0. For this reason, you should use the following
     * code to check if update() is successful or not:
     *
     * ~~~
     * if (this.update() !== false) {
     *     // update successful
     * } else {
     *     // update failed
     * }
     * ~~~
     *
     * @param {boolean} runValidation whether to perform validation before saving the record.
     * If the validation fails, the record will not be inserted into the database.
     * @param {[]} attributeNames list of attributes that need to be saved. Defaults to null,
     * meaning all attributes that are loaded from DB will be saved.
     * @returns {number|boolean} the number of rows affected, or false if validation fails
     * or [[beforeSave()]] stops the updating process.
     * @throws StaleObjectException if [[optimisticLock|optimistic locking]] is enabled and the data
     * being updated is outdated.
     * @throws \Exception in case update failed.
     */
    update(runValidation, attributeNames) {
        runValidation = runValidation !== false;
        attributeNames = attributeNames || null;

        return Promise.resolve().then(() => {
            if (runValidation) {
                return this.validate(attributeNames);
            }

            return true;
        }).then(isValidate => {
            if (!isValidate) {
                Jii.info('Model not updated due to validation error.');
                return false;
            }

            /*db = static.getDb();
             if (this.isTransactional(self.OP_UPDATE)) {
             transaction = db.beginTransaction();
             try {
             result = this.updateInternal(attributeNames);
             if (result === false) {
             transaction.rollBack();
             } else {
             transaction.commit();
             }
             } catch (\Exception e) {
             transaction.rollBack();
             throw e;
             }
             } else {*/
            return this._updateInternal(attributeNames); //}

        });
    }

    /**
     * Deletes the table row corresponding to this active record.
     *
     * This method performs the following steps in order:
     *
     * 1. call [[beforeDelete()]]. If the method returns false, it will skip the
     *    rest of the steps;
     * 2. delete the record from the database;
     * 3. call [[afterDelete()]].
     *
     * In the above step 1 and 3, events named [[EVENT_BEFORE_DELETE]] and [[EVENT_AFTER_DELETE]]
     * will be raised by the corresponding methods.
     *
     * @returns {number|boolean} the number of rows deleted, or false if the deletion is unsuccessful for some reason.
     * Note that it is possible the number of rows deleted is 0, even though the deletion execution is successful.
     * @throws StaleObjectException if [[optimisticLock|optimistic locking]] is enabled and the data
     * being deleted is outdated.
     * @throws \Exception in case delete failed.
     */
    delete() {
        /*db = static.getDb();
         if (this.isTransactional(self.OP_DELETE)) {
         transaction = db.beginTransaction();
         try {
         result = this.deleteInternal();
         if (result === false) {
         transaction.rollBack();
         } else {
         transaction.commit();
         }
         } catch (\Exception e) {
         transaction.rollBack();
         throw e;
         }
         } else {*/
        return this._deleteInternal(); //}

        //return result;
    }

    /**
     * Deletes an ActiveRecord without considering transaction.
     * @returns {number|boolean} the number of rows deleted, or false if the deletion is unsuccessful for some reason.
     * Note that it is possible the number of rows deleted is 0, even though the deletion execution is successful.
     * @throws StaleObjectException
     */
    _deleteInternal() {

        return this.beforeDelete().then(bool => {
            if (!bool) {
                return false;
            }

            return this.constructor.getDb().createCommand().deleteModel(this).then(result => {
                /*if (lock !== null && !result) {
                 throw new StaleObjectException('The object being deleted is outdated.');
                 }*/
                this.setOldAttributes(null);

                return this.afterDelete().then(() => {
                    return result;
                });
            });
        });
    }

    /**
     * Returns a value indicating whether the given active record is the same as the current one.
     * The comparison is made by comparing the table names and the primary key values of the two active records.
     * If one of the records [[isNewRecord|is new]] they are also considered not equal.
     * @param {ActiveRecord} record record to compare to
     * @returns {boolean} whether the two active records refer to the same row in the same database table.
     */
    equals(record) {
        if (this.isNewRecord() || record.isNewRecord()) {
            return false;
        }

        return this.constructor.tableName() === record.constructor.tableName() && this.getPrimaryKey() === record.getPrimaryKey();
    }

}
module.exports = ActiveRecord;