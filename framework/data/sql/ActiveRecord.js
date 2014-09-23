/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */

/**
 * @abstract
 * @class Jii.data.sql.ActiveRecord
 * @extends Jii.data.BaseActiveRecord
 */
Jii.defineClass('Jii.data.sql.ActiveRecord', {

	__extends: Jii.data.BaseActiveRecord,
	
	__static: {

		/**
		 * Returns the database connection used by this AR class.
		 * By default, the "db" application component is used as the database connection.
		 * You may override this method if you want to use a different database connection.
		 * @returns {Jii.data.sql.Connection} the database connection used by this AR class.
		 */
		getDb: function () {
			return Jii.app.getDb();
		},

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
		 * @returns {Jii.data.sql.ActiveQuery} the newly created [[ActiveQuery]] instance
		 */
		findBySql: function (sql, params) {
			params = params || [];

			var query = this.find();
			query.sql = sql;

			return query.params(params);
		},

		/**
		 * Finds ActiveRecord instance(s) by the given condition.
		 * This method is internally called by [[findOne()]] and [[findAll()]].
		 * @param {*} condition please refer to [[findOne()]] for the explanation of this parameter
		 * @param {boolean} one whether this method is called by [[findOne()]] or [[findAll()]]
		 * @returns {Promise}
		 * @throws {Jii.exceptions.InvalidConfigException} if there is no primary key defined
		 * @internal
		 */
		_findByCondition: function (condition, one) {
			var query = this.find();

			return Promise.resolve().then(function() {
				if (_.isArray(condition)) {
					return Promise.resolve(condition);
				}

				// query by primary key
				return this.primaryKey().then(function(primaryKey) {
					if (primaryKey.length > 0) {
						var pk = primaryKey[0];
						if (!_.isEmpty(query.join) || !_.isEmpty(query.joinWith)) {
							pk = this.tableName() + '.' + pk;
						}

						var conditionObject = {};
						conditionObject[pk] = condition;
						return conditionObject;
					}

					throw new Jii.exceptions.InvalidConfigException(this.className() + ' must have a primary key.');
				});
			}.bind(this)).then(function(condition) {
				query.andWhere(condition);

				return one ? query.one() : query.all();
			}.bind(this));
		},

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
		updateAll: function (attributes, condition, params) {
			condition = condition || '';
			params = params || {};

			var command = this.getDb().createCommand();
			command.update(this.tableName(), attributes, condition, params);

			return command.execute();
		},

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
		updateAllCounters: function (counters, condition, params) {
			condition = condition || '';
			params = params || {};

			var n = 0;
			_.each(counters, _.bind(function(value, name) {
				var params = {};
				params[':bp{' + n + '}'] = value;
				counters[name] = new Jii.data.sql.Expression('[[' + name + ']]+:bp{' + n + '}', params);
				n++;
			}, this));

			var command = this.getDb().createCommand();
			command.update(this.tableName(), counters, condition, params);

			return command.execute();
		},

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
		deleteAll: function (condition, params) {
			condition = condition || '';
			params = params || {};

			var command = this.getDb().createCommand();
			command.delete(this.tableName(), condition, params);

			return command.execute();
		},

		/**
		 * @inheritdoc
		 */
		find: function () {
			return Jii.createObject(Jii.data.sql.ActiveQuery.className(), [this.className()]);
		},

		/**
		 * Declares the name of the database table associated with this AR class.
		 * By default this method returns the class name as the table name by calling [[Inflector.camel2id()]]
		 * with prefix [[Connection.tablePrefix]]. For example if [[Connection.tablePrefix]] is 'tbl_',
		 * 'Customer' becomes 'tbl_customer', and 'OrderItem' becomes 'tbl_order_item'. You may override this method
		 * if the table is not named after this convention.
		 * @returns {string} the table name
		 */
		tableName: function () {
			var className = this.className();
			var name = className.substr(className.lastIndexOf('.') + 1);

			return '{{%' + _.string.underscored(name) + '}}';
		},

		/**
		 * Returns the schema information of the DB table associated with this AR class.
		 * @returns {Jii.data.sql.TableSchema} the schema information of the DB table associated with this AR class.
		 * @throws {Jii.exceptions.InvalidConfigException} if the table for the AR class does not exist.
		 */
		getTableSchema: function () {
			return this.getDb().getTableSchema(this.tableName()).then(function(schema) {
				if (schema === null) {
					throw new Jii.exceptions.InvalidConfigException("The table does not exist: " + this.tableName());
				}

				return schema;
			}.bind(this));
		},

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
		primaryKey: function () {
			return this.getTableSchema().then(function(schema) {
				return schema.primaryKey;
			});
		}

	},


	/**
	 * Loads default values from database table schema
	 *
	 * @param {boolean} skipIfSet if existing value should be preserved
	 * @returns {Promise} model instance
	 */
	loadDefaultValues: function (skipIfSet) {
		skipIfSet = skipIfSet || true;

		return this.getTableSchema().then(function(columns) {
			_.each(columns, function(column) {
				if (column.defaultValue !== null && (!skipIfSet || this.get(column.name) === null)) {
					this.set(column.name, column.defaultValue);
				}
			}.bind(this));

			return Promise.resolve();
		}.bind(this));
	},

	/**
	 * Returns the list of all attribute names of the model.
	 * The default implementation will return all column names of the table associated with this AR class.
	 * @returns {[]} list of attribute names.
	 */
	attributes: function () {
		return this.__static.getTableSchema().then(function(schema) {
			return _.keys(schema.columns);
		});
	},

});
