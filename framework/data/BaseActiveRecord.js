/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */

/**
 * @abstract
 * @class Jii.data.BaseActiveRecord
 * @extends Jii.data.Model
 */
Jii.defineClass('Jii.data.BaseActiveRecord', {

	__extends: Jii.data.Model,
	
	__static: {

		/**
		 * @event Event an event that is triggered when the record is initialized via [[init()]].
		 */
		EVENT_INIT: 'init',

		/**
		 * @event Event an event that is triggered after the record is created and populated with query result.
		 */
		EVENT_AFTER_FIND: 'afterFind',

		/**
		 * @event ModelEvent an event that is triggered before inserting a record.
		 * You may set [[ModelEvent.isValid]] to be false to stop the insertion.
		 */
		EVENT_BEFORE_INSERT: 'beforeInsert',

		/**
		 * @event Event an event that is triggered after a record is inserted.
		 */
		EVENT_AFTER_INSERT: 'afterInsert',

		/**
		 * @event ModelEvent an event that is triggered before updating a record.
		 * You may set [[ModelEvent.isValid]] to be false to stop the update.
		 */
		EVENT_BEFORE_UPDATE: 'beforeUpdate',

		/**
		 * @event Event an event that is triggered after a record is updated.
		 */
		EVENT_AFTER_UPDATE: 'afterUpdate',

		/**
		 * @event ModelEvent an event that is triggered before deleting a record.
		 * You may set [[ModelEvent.isValid]] to be false to stop the deletion.
		 */
		EVENT_BEFORE_DELETE: 'beforeDelete',

		/**
		 * @event Event an event that is triggered after a record is deleted.
		 */
		EVENT_AFTER_DELETE: 'afterDelete',


		/**
		 * @inheritdoc
		 * @returns {Jii.data.BaseActiveRecord} ActiveRecord instance matching the condition, or `null` if nothing matches.
		 */
		findOne: function (condition) {
			return this._findByCondition(condition, true);
		},

		/**
		 * @inheritdoc
		 * @returns {Jii.data.BaseActiveRecord[]} an array of ActiveRecord instances, or an empty array if nothing matches.
		 */
		findAll: function (condition) {
			return this._findByCondition(condition, false);
		},

		/**
		 * Finds ActiveRecord instance(s) by the given condition.
		 * This method is internally called by [[findOne()]] and [[findAll()]].
		 * @param {*} condition please refer to [[findOne()]] for the explanation of this parameter
		 * @param {boolean} one whether this method is called by [[findOne()]] or [[findAll()]]
		 * @returns {Jii.data.BaseActiveRecord|Jii.data.BaseActiveRecord[]}
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
							var conditionObject = {};
							conditionObject[primaryKey] = condition;
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
		 * @param {object} attributes attribute values (name-value pairs) to be saved into the table
		 * @param {string|[]} [condition] the conditions that will be put in the WHERE part of the UPDATE SQL.
		 * Please refer to [[Query.where()]] on how to specify this parameter.
		 * @returns {Promise.<number>} the number of rows updated
		 * @throws {Jii.exceptions.NotSupportedException} if not overrided
		 */
		updateAll: function (attributes, condition) {
			condition = condition || '';

			throw new Jii.exceptions.NotSupportedException('updateAll() is not supported.');
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
		 * @returns {number} the number of rows updated
		 * @throws {Jii.exceptions.NotSupportedException} if not overrided
		 */
		updateAllCounters: function (counters, condition) {
			condition = condition || '';

			throw new Jii.exceptions.NotSupportedException('updateAllCounters() is not supported.');
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
		 * @param {[]} [params] the parameters (name => value) to be bound to the query.
		 * @returns {number} the number of rows deleted
		 * @throws {Jii.exceptions.NotSupportedException} if not overrided
		 */
		deleteAll: function (condition, params) {
			condition = condition || '';
			params = params || [];

			throw new Jii.exceptions.NotSupportedException('deleteAll() is not supported.');
		},


		/**
		 * Populates an active record object using a row of data from the database/storage.
		 *
		 * This is an internal method meant to be called to create active record objects after
		 * fetching data from the database. It is mainly used by [[ActiveQuery]] to populate
		 * the query results into active records.
		 *
		 * When calling this method manually you should call [[afterFind()]] on the created
		 * record to trigger the [[EVENT_AFTER_FIND|afterFind Event]].
		 *
		 * @param {Jii.data.sql.BaseActiveRecord} record the record to be populated. In most cases this will be an instance
		 * created by [[instantiate()]] beforehand.
		 * @param {object} row attribute values (name => value)
		 */
		populateRecord: function (record, row) {
			return record.attributes().then(_.bind(function(columns) {

				_.each(row, _.bind(function(value, name) {
					if (_.indexOf(columns, name) !== -1) {
						record._attributes[name] = value;
					} else if (record.canSetProperty(name)) {
						record.set(name, value);
					}
				}, this));
				record._oldAttributes = record._attributes;
			}, this));
		},

		/**
		 * Creates an active record instance.
		 *
		 * This method is called together with [[populateRecord()]] by [[ActiveQuery]].
		 * It is not meant to be used for creating new records() directly.
		 *
		 * You may override this method if the instance being created
		 * depends on the row data to be populated into the record.
		 * For example, by creating a record based on the value of a column,
		 * you may implement the so-called single-table inheritance mapping.
		 * @param {object} row row data to be populated into the record.
		 * @returns {static} the newly created active record
		 */
		instantiate: function (row) {
			return new this();
		},

		/**
		 * Returns a value indicating whether the given set of attributes represents the primary key for this model
		 * @param {[]} keys the set of attributes to check
		 * @returns {boolean} whether the given set of attributes represents the primary key for this model
		 */
		isPrimaryKey: function (keys) {
			return this.primaryKey().then(function(pks) {
				if (keys.length !== pks.length) {
					return false;
				}
				return pks.sort().toString() === keys.sort().toString();
			});
		}

	},

	/**
	 * @type {object} related models indexed by the relation names
	 */
	_related: null,

	/**
	 * @type {object|null} old attribute values indexed by attribute names.
	 * This is `null` if the record [[isNewRecord|is new]].
	 */
	_oldAttributes: null,

	/**
	 * @constructor
	 */
	constructor: function () {
		this._related = {};
		this.__super.apply(this, arguments);
	},

	/**
	 * Initializes the object.
	 * This method is called at the end of the constructor.
	 * The default implementation will trigger an [[EVENT_INIT]] event.
	 * If you override this method, make sure you call the parent implementation at the end
	 * to ensure triggering of the event.
	 */
	init: function () {
		this.setScenario('insert');
		this.trigger(this.__static.EVENT_INIT);

		this._super();
	},

	/**
	 * Declares a `has-one` relation.
	 * The declaration is returned in terms of a relational [[ActiveQuery]] instance
	 * through which the related record can be queried and retrieved back.
	 *
	 * A `has-one` relation means that there is at most one related record matching
	 * the criteria set by this relation, e.g., a customer has one country.
	 *
	 * For example, to declare the `country` relation for `Customer` class, we can write
	 * the following code in the `Customer` class:
	 *
	 * ~~~
	 * public function getCountry()
	 * {
     *     return this.hasOne(Country.className(), {id: 'country_id'});
     * }
	 * ~~~
	 *
	 * Note that in the above, the 'id' key in the `link` parameter refers to an attribute name
	 * in the related class `Country`, while the 'country_id' value refers to an attribute name
	 * in the current AR class.
	 *
	 * Call methods declared in [[ActiveQuery]] to further customize the relation.
	 *
	 * @param {string} className the class name of the related record
	 * @param {[]} link the primary-foreign key constraint. The keys of the array refer to
	 * the attributes of the record associated with the `class` model, while the values of the
	 * array refer to the corresponding attributes in **this** AR class.
	 * @returns {Jii.data.ActiveQueryInterface} the relational query object.
	 */
	hasOne: function (className, link) {
		/** @type {class} ActiveRecordInterface */
		var classObject = Jii.namespace(className);

		/** @type {Jii.data.ActiveQuery} */
		var query = classObject.find();
		query.primaryModel = this;
		query.link = link;
		query.multiple = false;
		return query;
	},

	/**
	 * Declares a `has-many` relation.
	 * The declaration is returned in terms of a relational [[ActiveQuery]] instance
	 * through which the related record can be queried and retrieved back.
	 *
	 * A `has-many` relation means that there are multiple related records matching
	 * the criteria set by this relation, e.g., a customer has many orders.
	 *
	 * For example, to declare the `orders` relation for `Customer` class, we can write
	 * the following code in the `Customer` class:
	 *
	 * ~~~
	 * public function getOrders()
	 * {
		 *     return this.hasMany(Order.className(), {customer_id: 'id'});
		 * }
	 * ~~~
	 *
	 * Note that in the above, the 'customer_id' key in the `link` parameter refers to
	 * an attribute name in the related class `Order`, while the 'id' value refers to
	 * an attribute name in the current AR class.
	 *
	 * Call methods declared in [[ActiveQuery]] to further customize the relation.
	 *
	 * @param {string} className the class name of the related record
	 * @param {[]} link the primary-foreign key constraint. The keys of the array refer to
	 * the attributes of the record associated with the `class` model, while the values of the
	 * array refer to the corresponding attributes in **this** AR class.
	 * @returns {Jii.data.ActiveQueryInterface} the relational query object.
	 */
	hasMany: function (className, link) {
		/** @type {class} ActiveRecordInterface */
		var classObject = Jii.namespace(className);

		/** @type {Jii.data.ActiveQuery} */
		var query = classObject.find();
		query.primaryModel = this;
		query.link = link;
		query.multiple = true;
		return query;
	},

	get: function (name) {
		if (_.has(this._related, name)) {
			return this._related[name];
		}

		return this.__super.apply(this, arguments);
	},

	set: function () {
		// @todo add set relation
		this.__super.apply(this, arguments);
	},

	/**
	 * Populates the named relation with the related records.
	 * Note that this method does not check if the relation exists or not.
	 * @param {string} name the relation name (case-sensitive)
	 * @param {Jii.data.sql.ActiveRecordInterface|[]|null} records the related records to be populated into the relation.
	 */
	populateRelation: function (name, records) {
		this._related[name] = records;
	},

	/**
	 * Check whether the named relation has been populated with records.
	 * @param {string} name the relation name (case-sensitive)
	 * @returns {boolean} whether relation has been populated with records.
	 */
	isRelationPopulated: function (name) {
		return _.has(this._related, name);
	},

	/**
	 * Returns all populated related records.
	 * @returns {object} an array of related records indexed by relation names.
	 */
	getRelatedRecords: function () {
		return this._related;
	},

	/**
	 *
	 * @param {string} name
	 * @returns {boolean}
	 */
	hasAttribute: function (name) {
		return _.has(this._attributes, name) || _.indexOf(this.attributes(), name) !== -1;
	},

	/**
	 * Returns the named attribute value.
	 * If this record is the result of a query and the attribute is not loaded,
	 * null will be returned.
	 * @param {string} name the attribute name
	 * @returns {*} the attribute value. Null if the attribute is not set or does not exist.
	 * @see hasAttribute()
	 */
	getAttribute: function (name) {
		return _.has(this._attributes, name) ? this._attributes[name] : null;
	},

	/**
	 * Sets the named attribute value.
	 * @param {string} name the attribute name
	 * @param {*} value the attribute value.
	 * @throws {Jii.exceptions.InvalidParamException} if the named attribute does not exist.
	 * @see hasAttribute()
	 */
	setAttribute: function (name, value) {
		if (this.hasAttribute(name)) {
			this._attributes[name] = value;
		}

		throw new Jii.exceptions.InvalidParamException(this.className() + ' has no attribute named "' + name + '".');
	},

	/**
	 * Returns the old attribute values.
	 * @returns {object} the old attribute values (name-value pairs)
	 */
	getOldAttributes: function () {
		return this._oldAttributes || {};
	},

	/**
	 * Sets the old attribute values.
	 * All existing old attribute values will be discarded.
	 * @param {{}|null} values old attribute values to be set.
	 * If set to `null` this record is considered to be [[isNewRecord|new]].
	 */
	setOldAttributes: function (values) {
		this._oldAttributes = values;
	},

	/**
	 * Returns the old value of the named attribute.
	 * If this record is the result of a query and the attribute is not loaded,
	 * null will be returned.
	 * @param {string} name the attribute name
	 * @returns {*} the old attribute value. Null if the attribute is not loaded before
	 * or does not exist.
	 * @see hasAttribute()
	 */
	getOldAttribute: function (name) {
		return _.has(this._oldAttributes, name) ? this._oldAttributes[name] : null;
	},

	/**
	 * Sets the old value of the named attribute.
	 * @param {string} name the attribute name
	 * @param {*} value the old attribute value.
	 * @throws {Jii.exceptions.InvalidParamException} if the named attribute does not exist.
	 * @see hasAttribute()
	 */
	setOldAttribute: function (name, value) {
		if (_.has(this._oldAttributes, name) || this.hasAttribute(name)) {
			if (this._oldAttributes === null) {
				this._oldAttributes = {};
			}
			this._oldAttributes[name] = value;
		}

		throw new Jii.exceptions.InvalidParamException(this.className() + ' has no attribute named "' + name + '".');
	},

	/**
	 * Marks an attribute dirty.
	 * This method may be called to force updating a record when calling [[update()]],
	 * even if there is no change being made to the record.
	 * @param {string} name the attribute name
	 */
	markAttributeDirty: function (name) {
		delete this._oldAttributes[name];
	},

	/**
	 * Returns a value indicating whether the named attribute has been changed.
	 * @param {string} name the name of the attribute
	 * @returns {boolean} whether the attribute has been changed
	 */
	isAttributeChanged: function (name) {
		if (_.has(this._attributes, name) && this._oldAttributes && _.has(this._oldAttributes, name)) {
			return !_.isEqual(this._attributes[name], this._oldAttributes[name]);
		}

		return _.has(this._attributes, name) || (this._oldAttributes && _.has(this._oldAttributes, name));
	},

	/**
	 * Returns the attribute values that have been modified since they are loaded or saved most recently.
	 * @param {string[]|null} names the names of the attributes whose values may be returned if they are
	 * changed recently. If null, [[attributes()]] will be used.
	 * @returns {object} the changed attribute values (name-value pairs)
	 */
	getDirtyAttributes: function (names) {
		names = names || null;

		if (names === null) {
			names = this.attributes();
		}

		var attributes = {};
		_.each(this._attributes, _.bind(function(value, name) {
			if (_.indexOf(names, name) === -1) {
				return;
			}

			if (this._oldAttributes === null || !_.has(this._oldAttributes, name) || !_.isEqual(this._oldAttributes[name], value)) {
				attributes[name] = value;
			}
		}, this));

		return attributes;
	},

	/**
	 * Saves the current record.
	 *
	 * This method will call [[insert()]] when [[isNewRecord]] is true, or [[update()]]
	 * when [[isNewRecord]] is false.
	 *
	 * For example, to save a customer record:
	 *
	 * ~~~
	 * customer = new Customer();  // or customer = Customer.findOne(id);
	 * customer.name = name;
	 * customer.email = email;
	 * customer.save();
	 * ~~~
	 *
	 *
	 * @param {boolean} [runValidation] whether to perform validation before saving the record.
	 * If the validation fails, the record will not be saved to database.
	 * @param {string[]} [attributeNames] list of attribute names that need to be saved. Defaults to null,
	 * meaning all attributes that are loaded from DB will be saved.
	 * @returns {boolean} whether the saving succeeds
	 */
	save: function (runValidation, attributeNames) {
		runValidation = !_.isUndefined(runValidation) ? runValidation : true;
		attributeNames = attributeNames || null;

		if (this.isNewRecord()) {
			return this.insert(runValidation, attributeNames);
		} else {
			return this.update(runValidation, attributeNames).then(function(result) {
				return result !== false;
			});
		}
	},

	/**
	 * Inserts the record into the database using the attribute values of this record.
	 *
	 * Usage example:
	 *
	 * ```php
	 * $customer = new Customer;
	 * $customer->name = $name;
	 * $customer->email = $email;
	 * $customer->insert();
	 * ```
	 *
	 * @param {boolean} runValidation whether to perform validation before saving the record.
	 * If the validation fails, the record will not be inserted into the database.
	 * @param {object} attributeNames list of attributes that need to be saved. Defaults to null,
	 * meaning all attributes that are loaded from DB will be saved.
	 * @return boolean whether the attributes are valid and the record is inserted successfully.
	 */
	insert: function (runValidation, attributeNames) {

	},

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
	 * @param {boolean} [runValidation] whether to perform validation before saving the record.
	 * If the validation fails, the record will not be inserted into the database.
	 * @param {string[]} [attributeNames] list of attribute names that need to be saved. Defaults to null,
	 * meaning all attributes that are loaded from DB will be saved.
	 * @returns {Promise.<number|boolean>} the number of rows affected, or false if validation fails
	 * or [[beforeSave()]] stops the updating process.
	 * @throws StaleObjectException if [[optimisticLock|optimistic locking]] is enabled and the data
	 * being updated is outdated.
	 * @throws \Exception in case update failed.
	 */
	update: function (runValidation, attributeNames) {
		runValidation = !_.isUndefined(runValidation) ? runValidation : true;
		attributeNames = attributeNames || null;

		var validatePromise = runValidation ? this.validate(attributeNames) : Promise.resolve(true);
		return validatePromise.then(_.bind(function(isValid) {
			if (!isValid) {
				return false;
			}

			return this._updateInternal(attributeNames);
		}, this));
	},

	/**
	 * Updates the specified attributes.
	 *
	 * This method is a shortcut to [[update()]] when data validation is not needed
	 * and only a small set attributes need to be updated.
	 *
	 * You may specify the attributes to be updated as name list or name-value pairs.
	 * If the latter, the corresponding attribute values will be modified accordingly.
	 * The method will then save the specified attributes into database.
	 *
	 * Note that this method will **not** perform data validation and will **not** trigger events.
	 *
	 * @param {[]} attributes the attributes (names or name-value pairs) to be updated
	 * @returns {Promise.<number>} the number of rows affected.
	 */
	updateAttributes: function (attributes) {
		var attrs = [];
		_.each(attributes, _.bind(function(value, name) {
			if (_.isNumber(name)) {
				attrs.push(value);
			} else {
				this.set(name, value);
				attrs.push(name);
			}
		}, this));

		var values = this.getDirtyAttributes(attrs);
		if (_.isEmpty(values)) {
			return Promise.resolve(0);
		}

		return this.getOldPrimaryKey(true).then(_.bind(function(oldPrimaryKey) {
			return this.__static.updateAll(values, oldPrimaryKey);
		}, this)).then(_.bind(function(rows) {
			_.each(values, _.bind(function(value, name) {
				this._oldAttributes[name] = this._attributes[name];
			}, this));

			return rows;
		}, this));
	},

	/**
	 * @see update()
	 * @param {[]} [attributes] attributes to update
	 * @returns {Promise.<number>} number of rows updated
	 * @throws StaleObjectException
	 */
	_updateInternal: function (attributes) {
		attributes = attributes || null;

		return this.beforeSave(false).then(_.bind(function(bool) {
			if (!bool) {
				return Promise.resolve(false);
			}

			var values = this.getDirtyAttributes(attributes);
			if (_.isEmpty(values)) {
				return this.afterSave(false, values).then(function() {
					return 0;
				});
			}

			return this.getOldPrimaryKey(true).then(_.bind(function(condition) {

				// We do not check the return value of updateAll() because it's possible
				// that the UPDATE statement doesn't change anything and thus returns 0.
				return this.__static.updateAll(values, condition);
			}, this));
		}, this)).then(_.bind(function(rows) {

			var changedAttributes = {};
			_.each(values, _.bind(function(value, name) {
				changedAttributes[name] = _.has(this._oldAttributes, name) ? this._oldAttributes[name] : null;
				this._oldAttributes[name] = value;
			}, this));

			return this.afterSave(false, changedAttributes).then(function() {
				return rows;
			});
		}, this));
	},

	/**
	 * Updates one or several counter columns for the current AR object.
	 * Note that this method differs from [[updateAllCounters()]] in that it only
	 * saves counters for the current AR object.
	 *
	 * An example usage is as follows:
	 *
	 * ~~~
	 * post = Post.findOne(id);
	 * post.updateCounters({view_count: 1});
	 * ~~~
	 *
	 * @param {[]} counters the counters to be updated (attribute name => increment value)
	 * Use negative values if you want to decrement the counters.
	 * @returns {boolean} whether the saving is successful
	 * @see updateAllCounters()
	 */
	updateCounters: function (counters) {
		return this.getOldPrimaryKey(true).then(_.bind(function(oldPrimaryKey) {
			return this.__static.updateAllCounters(counters, oldPrimaryKey);
		}, this)).then(_.bind(function(affectedRows) {
			if (affectedRows === 0) {
				return Promise.resolve(false);
			}

			_.each(counters, function(value, name) {
				this._attributes[name] += value;
				this._oldAttributes[name] = this._attributes[name];
			}.bind(this));
			return Promise.resolve(true);
		}, this));
	},

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
	delete: function () {
		return this.beforeDelete().then(_.bind(function(bool) {
			if (!bool) {
				return Promise.resolve(false);
			}

			return this.getOldPrimaryKey(true).then(_.bind(function(condition) {

				// we do not check the return value of deleteAll() because it's possible
				// the record is already deleted in the database and thus the method will return 0
				return this.__static.deleteAll(condition);
			}, this));
		}, this)).then(_.bind(function(result) {

			this._oldAttributes = null;

			return this.afterDelete().then(function() {
				return result;
			});
		}, this));
	},

	/**
	 * Returns a value indicating whether the current record is new.
	 * @returns {boolean} whether the record is new and() should be inserted when calling [[save()]].
	 */
	isNewRecord: function () {
		return this._oldAttributes === null;
	},

	/**
	 * Sets the value indicating whether the record is new.
	 * @param {boolean} value whether the record is new and() should be inserted when calling [[save()]].
	 * @see isNewRecord()
	 */
	setIsNewRecord: function (value) {
		this._oldAttributes = value ? null : this._attributes;
	},

	/**
	 * This method is called when the AR object is created and populated with the query result.
	 * The default implementation will trigger an [[EVENT_AFTER_FIND]] event.
	 * When overriding this method, make sure you call the parent implementation to ensure the
	 * event is triggered.
	 */
	afterFind: function () {
		this.trigger(this.__static.EVENT_AFTER_FIND);

		return Promise.resolve();
	},

	/**
	 * This method is called at the beginning of inserting or updating a record.
	 * The default implementation will trigger an [[EVENT_BEFORE_INSERT]] event when `insert` is true,
	 * or an [[EVENT_BEFORE_UPDATE]] event if `insert` is false.
	 * When overriding this method, make sure you call the parent implementation like the following:
	 *
	 * ~~~
	 * public function beforeSave(insert)
	 * {
     *     if (parent.beforeSave(insert)) {
     *         // ...custom code here...
     *         return true;
     *     } else {
     *         return false;
     *     }
     * }
	 * ~~~
	 *
	 * @param {boolean} insert whether this method called while inserting a record.
	 * If false, it means the method is called while updating a record.
	 * @returns {Promise.<boolean>} whether the insertion or updating should continue.
	 * If false, the insertion or updating will be cancelled.
	 */
	beforeSave: function (insert) {
		var event = new Jii.data.ModelEvent();
		this.trigger(insert ? this.__static.EVENT_BEFORE_INSERT : this.__static.EVENT_BEFORE_UPDATE, event);

		return Promise.resolve(event.isValid);
	},

	/**
	 * This method is called at the end of inserting or updating a record.
	 * The default implementation will trigger an [[EVENT_AFTER_INSERT]] event when `insert` is true,
	 * or an [[EVENT_AFTER_UPDATE]] event if `insert` is false. The event class used is [[AfterSaveEvent]].
	 * When overriding this method, make sure you call the parent implementation so that
	 * the event is triggered.
	 * @param {boolean} insert whether this method called while inserting a record.
	 * If false, it means the method is called while updating a record.
	 * @param {[]} changedAttributes The old values of attributes that had changed and were saved.
	 * You can use this parameter to take action based on the changes made for example send an email
	 * when the password had changed or implement audit trail that tracks all the changes.
	 * `changedAttributes` gives you the old attribute values while the active record (`this`) has
	 * already the new, updated values.
	 */
	afterSave: function (insert, changedAttributes) {
		this.trigger(insert ? this.__static.EVENT_AFTER_INSERT : this.__static.EVENT_AFTER_UPDATE, new AfterSaveEvent({
			changedAttributes: changedAttributes
		}));

		return Promise.resolve();
	},

	/**
	 * This method is invoked before deleting a record.
	 * The default implementation raises the [[EVENT_BEFORE_DELETE]] event.
	 * When overriding this method, make sure you call the parent implementation like the following:
	 *
	 * ~~~
	 * public function beforeDelete()
	 * {
     *     if (parent.beforeDelete()) {
     *         // ...custom code here...
     *         return true;
     *     } else {
     *         return false;
     *     }
     * }
	 * ~~~
	 *
	 * @returns {boolean} whether the record should be deleted. Defaults to true.
	 */
	beforeDelete: function () {
		var event = new Jii.data.ModelEvent();
		this.trigger(this.__static.EVENT_BEFORE_DELETE, event);

		return Promise.resolve(event.isValid);
	},

	/**
	 * This method is invoked after deleting a record.
	 * The default implementation raises the [[EVENT_AFTER_DELETE]] event.
	 * You may override this method to do postprocessing after the record is deleted.
	 * Make sure you call the parent implementation so that the event is raised properly.
	 */
	afterDelete: function () {
		this.trigger(this.__static.EVENT_AFTER_DELETE);
		return Promise.resolve();
	},

	/**
	 * Repopulates this active record with the latest data.
	 * @returns {boolean} whether the row still exists in the database. If true, the latest data
	 * will be populated to this active record. Otherwise, this record will remain unchanged.
	 */
	refresh: function () {
		return this.getPrimaryKey(true).then(_.bind(function(primaryKey) {
				return this.findOne(primaryKey);
		}, this)).then(_.bind(function(record) {
			if (record === null) {
				return Promise.resolve(false);
			}

			_.each(this.attributes(), _.bind(function(name) {
				this._attributes[name] = _.has(record._attributes, name) ? record._attributes[name] : null;
			}, this));
			this._oldAttributes = this._attributes;
			this._related = [];

			return Promise.resolve(true);
		}, this));
	},

	/**
	 * Returns a value indicating whether the given active record is the same as the current one.
	 * The comparison is made by comparing the table names and the primary key values of the two active records.
	 * If one of the records [[isNewRecord|is new]] they are also considered not equal.
	 * @param {Jii.data.BaseActiveRecord} record record to compare to
	 * @returns {boolean} whether the two active records refer to the same row in the same database table.
	 */
	equals: function (record) {
		if (this.isNewRecord() || record.isNewRecord()) {
			return Promise.resolve(false);
		}

		if (this.className() !== record.className()) {
			return Promise.resolve(false);
		}

		return Promise.all([this.getPrimaryKey(), record.getPrimaryKey()]).then(function(pk1, pk2) {
			return pk1.toString() === pk2.toString();
		});

	},

	/**
	 * Returns the primary key value(s).
	 * @param {boolean} [asArray] whether to return the primary key value as an array. If true,
	 * the return value will be an array with column names as keys and column values as values.
	 * Note that for composite primary keys, an array will always be returned regardless of this parameter value.
	 * @property mixed The primary key value. An array (column name => column value) is returned if
	 * the primary key is composite. A string is returned otherwise (null will be returned if
	 * the key value is null).
	 * @returns {*} the primary key value. An array (column name => column value) is returned if the primary key
	 * is composite or `asArray` is true. A string is returned otherwise (null will be returned if
	 * the key value is null).
	 */
	getPrimaryKey: function (asArray) {
		asArray = asArray || false;

		return this.primaryKey().then(_.bind(function(keys) {
			if (keys.length === 1 && !asArray) {
				return _.has(this._attributes, keys[0]) ? this._attributes[keys[0]] : null;
			}

			var values = {};
			_.each(keys, _.bind(function(name) {
				values[name] = _.has(this._attributes, name) ? this._attributes[name] : null;
			}, this));

			return values;
		}, this));
	},

	/**
	 * Returns the old primary key value(s).
	 * This refers to the primary key value that is populated into the record
	 * after executing a find method (e.g. find(), findOne()).
	 * The value remains unchanged even if the primary key attribute is manually assigned with a different value.
	 * @param {boolean} [asArray] whether to return the primary key value as an array. If true,
	 * the return value will be an array with column name as key and column value as value.
	 * If this is false (default), a scalar value will be returned for non-composite primary key.
	 * @property mixed The old primary key value. An array (column name => column value) is
	 * returned if the primary key is composite. A string is returned otherwise (null will be
	 * returned if the key value is null).
	 * @returns {*} the old primary key value. An array (column name => column value) is returned if the primary key
	 * is composite or `asArray` is true. A string is returned otherwise (null will be returned if
	 * the key value is null).
	 */
	getOldPrimaryKey: function (asArray) {
		asArray = asArray || false;

		return this.primaryKey().then(_.bind(function(keys) {
			if (keys.length === 1 && !asArray) {
				return _.has(this._oldAttributes, keys[0]) ? this._oldAttributes[keys[0]] : null;
			}

			var values = {};
			_.each(keys, _.bind(function(name) {
				values[name] = _.has(this._oldAttributes, name) ? this._oldAttributes[name] : null;
			}, this));

			return values;
		}, this));
	},

	/**
	 * Returns the relation object with the specified name.
	 * A relation is defined by a getter method which returns an [[ActiveQueryInterface]] object.
	 * It can be declared in either the Active Record class itself or one of its behaviors.
	 * @param {string} name the relation name
	 * @param {boolean} [throwException] whether to throw exception if the relation does not exist.
	 * @returns {Promise.<Jii.data.sql.ActiveQuery>} the relational query object. If the relation does not exist
	 * and `throwException` is false, null will be returned.
	 * @throws {Jii.exceptions.InvalidParamException} if the named relation does not exist.
	 */
	getRelation: function (name, throwException) {
		throwException = !_.isUndefined(throwException) ? throwException : true;

		var getter = 'get' + _.string.capitalize(name);
		if (_.isFunction(this[getter])) {
			return this[getter]();
		} else if (throwException) {
			throw new Jii.exceptions.InvalidParamException(this.className() + ' has no relation named `' + name + '`.');
		}

		return Promise.resolve(null);
	},

	/**
	 * Establishes the relationship between two models.
	 *
	 * The relationship is established by setting the foreign key value(s) in one model
	 * to be the corresponding primary key value(s) in the other model.
	 * The model with the foreign key will be saved into database without performing validation.
	 *
	 * If the relationship involves a pivot table, a new row() will be inserted into the
	 * pivot table which contains the primary key values from both models.
	 *
	 * Note that this method requires that the primary key value is not null.
	 *
	 * @param {string} name the case sensitive name of the relationship
	 * @param {Jii.data.BaseActiveRecord} model the model to be linked with the current one.
	 * @param {[]} extraColumns additional column values to be saved into the pivot table.
	 * This parameter is only meaningful for a relationship involving a pivot table
	 * (i.e., a relation set with [[ActiveRelationTrait.via()]] or `[[ActiveQuery.viaTable()]]`.)
	 * @returns {Promise}
	 * @throws {Jii.exceptions.InvalidCallException} if the method is unable to link two models.
	 */
	link: function (name, model, extraColumns) {
		extraColumns = extraColumns || [];

		var relation = this.getRelation(name);

		return Promise.resolve().then(_.bind(function() {
			if (relation.via !== null) {
				if (this.isNewRecord() || model.isNewRecord()) {
					throw new Jii.exceptions.InvalidCallException('Unable to link models: both models must NOT be newly created.');
				}

				var viaName = null;
				var viaRelation = null;
				var viaClass = null;
				var viaTable = null;

				if (_.isArray(relation.via)) {
					/** @type {Jii.data.BaseActiveRecord} */
					viaName = relation.via[0];
					viaRelation = relation.via[1];

					/** @type {Jii.data.BaseActiveRecord} */
					viaClass = viaRelation.modelClass;

					// unset viaName so that it can be reloaded to reflect the change
					delete this._related[viaName];
				} else {
					viaRelation = relation.via;
					viaTable = _.first(relation.via.from);
				}

				var columns = [];
				_.each(viaRelation.link, _.bind(function(b, a) {
					columns[a] = this.get(b);
				}, this));
				_.each(relation.link, _.bind(function(b, a) {
					columns[b] = model.get(a);
				}, this));
				_.each(extraColumns, _.bind(function(v, k) {
					columns[k] = v;
				}, this));

				if (_.isArray(relation.via)) {
					/** @type {Jii.data.BaseActiveRecord} */
					var record = new viaClass();
					_.each(columns, _.bind(function(value, column) {
						record.set(column, value);
					}, this));
					return record.insert(false);
				}

				/* @type {viaTable} string */
				return this.__static.getDb().createCommand().insert(viaTable, columns).execute();
			}

			return Promise.all([
					model.isPrimaryKey(_.keys(relation.link)),
					this.isPrimaryKey(_.values(relation.link))
				]).then(_.bind(function(p1, p2) {
					if (p1 && p2) {
						if (this.isNewRecord() && model.isNewRecord()) {
							throw new Jii.exceptions.InvalidCallException('Unable to link models: both models are newly created.');
						} else if (this.isNewRecord()) {
							var link = {};
							for (var fk in relation.link) {
								if (relation.link.hasOwnProperty(fk)) {
									link[relation.link[fk]] = fk;
								}
							}
							this._bindModels(link, this, model);
						} else {
							this._bindModels(relation.link, model, this);
						}
					} else if (p1) {
						var link2 = {};
						for (var fk2 in relation.link) {
							if (relation.link.hasOwnProperty(fk2)) {
								link2[relation.link[fk2]] = fk2;
							}
						}
						this._bindModels(link2, this, model);
					} else if (p2) {
						this._bindModels(relation.link, model, this);
					} else {
						throw new Jii.exceptions.InvalidCallException('Unable to link models: the link does not involve any primary key.');
					}

					return Promise.resolve();
				}, this));
		}, this)).then(_.bind(function() {
			// update lazily loaded related objects
			if (!relation.multiple) {
				this._related[name] = model;
			} else if (_.has(this._related, name)) {
				if (relation.indexBy !== null) {
					this._related[name][model.get(relation.indexBy)] = model;
				} else {
					this._related[name].push(model);
				}
			}

			return Promise.resolve();
		}, this));
	},

	/**
	 * Destroys the relationship between two models.
	 *
	 * The model with the foreign key of the relationship will be deleted if `delete` is true.
	 * Otherwise, the foreign key will be set null and the model will be saved without validation.
	 *
	 * @param {string} name the case sensitive name of the relationship.
	 * @param {Jii.data.BaseActiveRecord} model the model to be unlinked from the current one.
	 * @param {boolean} [isDelete] whether to delete the model that contains the foreign key.
	 * If false, the model's foreign key will be set null and saved.
	 * If true, the model containing the foreign key will be deleted.
	 * @returns {Promise}
	 * @throws InvalidCallException if the models cannot be unlinked
	 */
	unlink: function (name, model, isDelete) {
		isDelete = isDelete || false;

		var relation = this.getRelation(name);

		return Promise.resolve().then(_.bind(function() {

			if (relation.via !== null) {

				var viaName = null;
				var viaRelation = null;
				var viaClass = null;
				var viaTable = null;

				if (_.isArray(relation.via)) {
					/** @type {Jii.data.BaseActiveRecord} */
					viaName = relation.via[0];
					viaRelation = relation.via[1];

					/** @type {Jii.data.BaseActiveRecord} */
					viaClass = viaRelation.modelClass;

					delete this._related[viaName];
				} else {
					viaRelation = relation.via;
					viaTable = _.first(relation.via.from);
				}

				var columns = [];
				var nulls = [];
				_.each(viaRelation.link, _.bind(function(b, a) {
					columns[a] = this.get(b);
				}, this));
				_.each(relation.link, _.bind(function(b, a) {
					columns[b] = model.get(a);
				}, this));
				_.each(_.keys(columns), _.bind(function(k) {
					nulls[k] = null;
				}, this));

				if (_.isArray(relation.via)) {
					if (isDelete) {
						return viaClass.deleteAll(columns);
					}

					return viaClass.updateAll(nulls, columns);
				}

				/* @type Jii.data.sql.Command */
				var command = this.__static.getDb().createCommand();
				if (isDelete) {
					return command.delete(viaTable, columns).execute();
				}

				return command.update(viaTable, nulls, columns).execute();
			}

			return Promise.all([
					model.isPrimaryKey(_.keys(relation.link)),
					this.isPrimaryKey(_.values(relation.link))
				]).then(_.bind(function(p1, p2) {
					if (p1 && p2 || p2) {
						_.each(relation.link, _.bind(function(b, a) {
							model.set(a, null);
						}, this));

						return isDelete ? model.delete() : model.save(false);
					}

					if (p1) {
						_.each(relation.link, _.bind(function(b, a) {
							var values = this.get(b);

							if (_.isArray(values)) { // relation via array valued attribute
								var index = _.indexOf(values, model.get(a));
								if (index !== -1) {
									values.splice(index, 1);
								}
							} else {
								this.set(b, null);
							}
						}, this));

						return isDelete ? this.delete() : this.save(false);
					}

					throw new Jii.exceptions.InvalidCallException('Unable to unlink models: the link does not involve any primary key.');
				}, this));
		}, this)).then(_.bind(function() {

				if (!relation.multiple) {
					delete this._related[name];
					return Promise.resolve();
				}

				if (_.has(this._related, name)) {
					var promises = [];

					_.each(this._related[name], _.bind(function(b, a) {
						var promise = Promise.all([
							model.getPrimaryKey(),
							b.getPrimaryKey()
						]);
						promises.push(promise);

						promise.then(_.bind(function(pk1, pk2) {
							if (pk1 === pk2) {
								delete this._related[name][a];
							}
						}, this));
					}, this));

					return Promise.all(promises);
				}

				return Promise.resolve();
		}, this));
	},

	/**
	 * Destroys the relationship in current model.
	 *
	 * The model with the foreign key of the relationship will be deleted if `delete` is true.
	 * Otherwise, the foreign key will be set null and the model will be saved without validation.
	 *
	 * Note that to destroy the relationship without removing records make sure your keys can be set to null
	 *
	 * @param {string} name the case sensitive name of the relationship.
	 * @param {boolean} [isDelete] whether to delete the model that contains the foreign key.
	 * @returns {Promise}
	 */
	unlinkAll: function (name, isDelete) {
		isDelete = isDelete || false;

		var relation = this.getRelation(name);

		return Promise.resolve().then(_.bind(function() {

			if (relation.via !== null) {

				var viaName = null;
				var viaRelation = null;
				var viaClass = null;
				var viaTable = null;

				if (_.isArray(relation.via)) {
					/** @type {Jii.data.BaseActiveRecord} */
					viaName = relation.via[0];
					viaRelation = relation.via[1];

					/** @type {Jii.data.BaseActiveRecord} */
					viaClass = viaRelation.modelClass;

					delete this._related[viaName];
				} else {
					viaRelation = relation.via;
					viaTable = _.first(relation.via.from);
				}

				var condition = [];
				var nulls = [];
				_.each(viaRelation.link, _.bind(function(b, a) {
					nulls[a] = null;
					condition[a] = this.get(b);
				}, this));

				if (_.isArray(relation.via)) {
					if (isDelete) {
						return viaClass.deleteAll(condition);
					}
					return viaClass.updateAll(nulls, condition);
				}

				/** @type {Jii.data.sql.Command} */
				var command = this.__static.getDb().createCommand();
				if (isDelete) {
					return command.delete(viaTable, condition).execute();
				}

				return command.update(viaTable, nulls, condition).execute();
			}

			/* @type {Jii.data.BaseActiveRecord} */
			var relatedModel = relation.modelClass;
			var key = relation.link[0];
			if (!isDelete && relation.link.length == 1 && _.isArray(this.get(key))) {
				// relation via array valued attribute
				this.set(key, []);
				this.save(false);
			} else {
				var nulls2 = [];
				var condition2 = [];
				_.each(relation.link, _.bind(function(b, a) {
					nulls2[a] = null;
					condition2[a] = this.get(b);
				}, this));

				if (isDelete) {
					return relatedModel.deleteAll(condition2);
				}
				return relatedModel.updateAll(nulls2, condition2);
			}
		}, this)).then(_.bind(function() {
			delete this._related[name];
		}, this));
	},

	/**
	 * @param {object} link
	 * @param {Jii.data.BaseActiveRecord} foreignModel
	 * @param {Jii.data.BaseActiveRecord} primaryModel
	 * @throws {Jii.exceptions.InvalidCallException}
	 * @returns {Promise}
	 */
	_bindModels: function (link, foreignModel, primaryModel) {
		_.each(link, _.bind(function(pk, fk) {
			var value = primaryModel.get(pk);
			if (value === null) {
				throw new Jii.exceptions.InvalidCallException('Unable to link models: the primary key of `' + primaryModel.className() + '` is null.');
			}

			if (_.isArray(foreignModel.get(fk))) { // relation via array valued attribute
				foreignModel.get(fk).concat(value);
			} else {
				foreignModel.set(fk, value);
			}
		}, this));

		return foreignModel.save(false);
	},




	/**
	 * Returns the text label for the specified attribute.
	 * If the attribute looks like `relatedModel.attribute`, then the attribute will be received from the related model.
	 * @param {string} attribute the attribute name
	 * @returns {string} the attribute label
	 * @see generateAttributeLabel()
	 * @see attributeLabels()
	 */
	getAttributeLabel: function (attribute) {
		var labels = this.attributeLabels();

		if (_.has(labels[attribute])) {
			return labels[attribute];
		}

		if (attribute.indexOf('.') !== -1) {
			var attributeParts = attribute.split('.');
			var neededAttribute = attributeParts.pop();

			var relatedModel = this;
			_.each(attributeParts, _.bind(function(relationName) {
				if (_.has(this._related, relationName) && this._related[relationName] instanceof Jii.data.BaseActiveRecord) {
					relatedModel = this._related[relationName];
				} else {
					// @todo
					/*try {
						relation = relatedModel.getRelation(relationName);
					} catch (InvalidParamException e) {
						return this.generateAttributeLabel(attribute);
					}
					relatedModel = new relation.modelClass();*/
				}
			}, this));

			labels = relatedModel.attributeLabels();

			if (_.has(labels[attribute])) {
				return labels[attribute];
			}
		}

		return this.generateAttributeLabel(attribute);
	}

});
