/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */

'use strict';

var Jii = require('../BaseJii');
var Event = require('../base/Event');
var ModelSchema = require('./ModelSchema');
var InvalidConfigException = require('../exceptions/InvalidConfigException');
var NotSupportedException = require('../exceptions/NotSupportedException');
var ChangeAttributeEvent = require('./ChangeAttributeEvent');
var InvalidParamException = require('../exceptions/InvalidParamException');
var ModelEvent = require('../base/ModelEvent');
var AfterSaveEvent = require('./AfterSaveEvent');
var InvalidCallException = require('../exceptions/InvalidCallException');
var Collection = require('../base/Collection');
var ActiveQuery = require('./ActiveQuery');
var _upperFirst = require('lodash/upperFirst');
var _isArray = require('lodash/isArray');
var _isObject = require('lodash/isObject');
var _isEmpty = require('lodash/isEmpty');
var _indexOf = require('lodash/indexOf');
var _isEqual = require('lodash/isEqual');
var _isNumber = require('lodash/isNumber');
var _isUndefined = require('lodash/isUndefined');
var _isFunction = require('lodash/isFunction');
var _each = require('lodash/each');
var _clone = require('lodash/clone');
var _size = require('lodash/size');
var _keys = require('lodash/keys');
var _has = require('lodash/has');
var _filter = require('lodash/filter');
var _first = require('lodash/first');
var _values = require('lodash/values');
var _map = require('lodash/map');
var Model = require('../base/Model');

/**
 * @abstract
 * @class Jii.data.BaseActiveRecord
 * @extends Jii.base.Model
 */
var BaseActiveRecord = Jii.defineClass('Jii.data.BaseActiveRecord', /** @lends Jii.data.BaseActiveRecord.prototype */{

	__extends: Model,
	
	__static: /** @lends Jii.data.BaseActiveRecord */{

        /**
         * @event Jii.data.BaseActiveRecord#init
         * @property {Jii.base.Event} event an event that is triggered when the record is initialized via [[init()]].
         */
		EVENT_INIT: 'init',

        /**
         * @event Jii.data.BaseActiveRecord#afterFind
         * @property {Jii.base.Event} event an event that is triggered after the record is created and populated with query result.
         */
		EVENT_AFTER_FIND: 'afterFind',

        /**
         * You may set [[Jii.base.ModelEvent.isValid]] to be false to stop the insertion.
         * @event Jii.data.BaseActiveRecord#beforeInsert
         * @property {Jii.base.ModelEvent} event an event that is triggered before inserting a record.
         */
		EVENT_BEFORE_INSERT: 'beforeInsert',

        /**
         * Event an event that is triggered after a record is inserted.
         * @event Jii.data.BaseActiveRecord#afterInsert
         * @property {Jii.data.AfterSaveEvent} event
         */
		EVENT_AFTER_INSERT: 'afterInsert',

        /**
         * You may set [[ModelEvent.isValid]] to be false to stop the update.
         * @event Jii.data.BaseActiveRecord#beforeUpdate
         * @property {Jii.base.ModelEvent} event an event that is triggered before updating a record.
         */
		EVENT_BEFORE_UPDATE: 'beforeUpdate',

        /**
         * @event Jii.data.BaseActiveRecord#afterUpdate
         * @property {Jii.data.AfterSaveEvent} event an event that is triggered after a record is updated.
         */
		EVENT_AFTER_UPDATE: 'afterUpdate',

		/**
         * You may set [[ModelEvent.isValid]] to be false to stop the deletion.
         * @event Jii.data.BaseActiveRecord#beforeDelete
		 * @property {Jii.base.ModelEvent} event an event that is triggered before deleting a record.
		 */
		EVENT_BEFORE_DELETE: 'beforeDelete',

		/**
         * @event Jii.data.BaseActiveRecord#afterDelete
		 * @property {Jii.base.Event} event an event that is triggered after a record is deleted.
		 */
		EVENT_AFTER_DELETE: 'afterDelete',

		_modelSchema: {},

		/**
		 * @returns {{}}
		 */
		modelSchema() {
			return {};
		},

		/**
		 * @returns {Jii.data.TableSchema}
		 */
		getTableSchema() {
			const className = this.className();

			if (!this._modelSchema[className]) {
				let schema = this.modelSchema();
				if (!(schema instanceof ModelSchema)) {
					schema = ModelSchema.createFromObject(schema);
				}

				this._modelSchema[className] = schema;
			}
			return this._modelSchema[className];
		},

        tableName() {
            return null;
        },

		/**
		 * @inheritdoc
		 * @returns {Jii.data.BaseActiveRecord} BaseActiveRecord instance matching the condition, or `null` if nothing matches.
		 */
		findOne(condition) {
			return this._findByCondition(condition, true);
		},

		/**
		 * @inheritdoc
		 * @returns {Jii.data.BaseActiveRecord[]} an array of BaseActiveRecord instances, or an empty array if nothing matches.
		 */
		findAll(condition) {
			return this._findByCondition(condition, false);
		},

		/**
		 * @inheritdoc
		 */
		find() {
			return new ActiveQuery(this);
		},

        /**
         * Returns the database connection used by this AR class.
         * By default, the "db" application component is used as the database connection.
         * You may override this method if you want to use a different database connection.
         * @returns {Jii.data.BaseConnection} the database connection used by this AR class.
         */
        getDb() {
            return Jii.app ? Jii.app.getComponent('db') : null;
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
        primaryKey() {
            return this.getTableSchema().primaryKey;
        },

		/**
		 * Finds BaseActiveRecord instance(s) by the given condition.
		 * This method is internally called by [[findOne()]] and [[findAll()]].
		 * @param {*} condition please refer to [[findOne()]] for the explanation of this parameter
		 * @param {boolean} one whether this method is called by [[findOne()]] or [[findAll()]]
		 * @returns {Jii.data.BaseActiveRecord|Jii.data.BaseActiveRecord[]}
		 * @throws {Jii.exceptions.InvalidConfigException} if there is no primary key defined
		 * @internal
		 */
		_findByCondition(condition, one) {
			var query = this.find();

			return Promise.resolve().then(() => {
				if (_isArray(condition) || _isObject(condition)) {
					return Promise.resolve(condition);
				}

				var primaryKey = this.primaryKey();

				// query by primary key
				if (primaryKey.length > 0) {
					var pk = primaryKey[0];
					if (!_isEmpty(query.getJoin()) || !_isEmpty(query.getJoinWith())) {
						pk = this.tableName() + '.' + pk;
					}

					var conditionObject = {};
					conditionObject[pk] = condition;
					return conditionObject;
				}

				throw new InvalidConfigException(this.className() + ' must have a primary key.');
			}).then(condition => {
				query.andWhere(condition);

				return one ? query.one() : query.all();
			});
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
		updateAll(attributes, condition) {
			condition = condition || '';

			throw new NotSupportedException('updateAll() is not supported.');
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
		updateAllCounters(counters, condition) {
			condition = condition || '';

			throw new NotSupportedException('updateAllCounters() is not supported.');
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
		deleteAll(condition, params) {
			condition = condition || '';
			params = params || [];

			throw new NotSupportedException('deleteAll() is not supported.');
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
		 * @param {Jii.data.BaseActiveRecord} record the record to be populated. In most cases this will be an instance
		 * created by [[instantiate()]] beforehand.
		 * @param {object} row attribute values (name => value)
		 */
		populateRecord(record, row) {
			var columns = record.attributes();

			_each(row, (value, name) => {
				if (_indexOf(columns, name) !== -1) {
					record._attributes[name] = value;
				} else if (record.canSetProperty(name) || record.hasRelation(name)) {
					record.set(name, value);
				}
			});
			record.setOldAttributes(_clone(record._attributes));
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
		 * @returns {Jii.data.BaseActiveRecord} the newly created active record
		 */
		instantiate(row) {
			return new this(row);
		},

		/**
		 * Returns a value indicating whether the given set of attributes represents the primary key for this model
		 * @param {[]} keys the set of attributes to check
		 * @returns {boolean} whether the given set of attributes represents the primary key for this model
		 */
		isPrimaryKey(keys) {
			var pks = this.primaryKey();

			if (keys.length !== _size(pks)) {
				return false;
			}
            return (!_isArray(pks) ? _keys(pks) : pks).sort().toString() === keys.sort().toString();
		}

	},

	/**
	 * @type {object} related models indexed by the relation names
	 */
	_related: {},

	/**
	 * @type {object}
	 */
	_relatedFetched: {},

	/**
	 * @type {object}
	 */
    _relatedEvents: {},

	/**
	 * @type {object|null} old attribute values indexed by attribute names.
	 * This is `null` if the record [[isNewRecord|is new]].
	 */
	_oldAttributes: null,

	/**
	 * Initializes the object.
	 * This method is called at the end of the constructor.
	 * The default implementation will trigger an [[EVENT_INIT]] event.
	 * If you override this method, make sure you call the parent implementation at the end
	 * to ensure triggering of the event.
	 */
	init() {
		this.trigger(this.__static.EVENT_INIT);

		this.__super();
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
	 * @param {object} link the primary-foreign key constraint. The keys of the array refer to
	 * the attributes of the record associated with the `class` model, while the values of the
	 * array refer to the corresponding attributes in **this** AR class.
	 * @returns {Jii.data.ActiveQuery} the relational query object.
	 */
	hasOne(className, link) {
		/** @typedef {Jii.data.ActiveRecord} classObject */
		var classObject = Jii.namespace(className);

		/** @typedef {Jii.data.ActiveQuery} query */
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
	 * @param {object} link the primary-foreign key constraint. The keys of the array refer to
	 * the attributes of the record associated with the `class` model, while the values of the
	 * array refer to the corresponding attributes in **this** AR class.
	 * @returns {Jii.data.ActiveQuery} the relational query object.
	 */
	hasMany(className, link) {
		var classObject = Jii.namespace(className);

		/** @type {Jii.data.ActiveQuery} */
		var query = classObject.find();
		query.primaryModel = this;
		query.link = link;
		query.multiple = true;
		return query;
	},

	load(name) {
        this._fetchRelationFromRoot(name);

		if (this._related[name]) {
			return Promise.resolve(this._related[name]);
		}

		var relation = this.getRelation(name);
		if (_isFunction(relation.findFor)) {
			return relation.findFor(name, this).then(models => {
                this._setRelated(name, relation.multiple ? this._createRelatedCollection(name, models) : models);
				return this._related[name];
			});
		}

		return relation;
	},

	/**
	 * Populates the named relation with the related records.
	 * Note that this method does not check if the relation exists or not.
	 * @param {string} name the relation name (case-sensitive)
	 * @param {Jii.data.BaseActiveRecord|Jii.data.BaseActiveRecord[]|null} records the related records to be populated into the relation.
	 */
	populateRelation(name, records) {
        this._setRelated(name, _isArray(records) ? this._createRelatedCollection(name, records) : records);
	},

	/**
	 * Check whether the named relation has been populated with records.
	 * @param {string} name the relation name (case-sensitive)
	 * @returns {boolean} whether relation has been populated with records.
	 */
	isRelationPopulated(name) {
		return _has(this._related, name);
	},

	/**
	 * Returns all populated related records.
	 * @returns {object} an array of related records indexed by relation names.
	 */
	getRelatedRecords() {
		return this._related;
	},

    /**
     * Get attribute value
     * @param {String} name
     * @returns {*}
     */
    get(name) {
        if (this.hasRelation(name)) {
            var relation = this.getRelation(name);
            this._fetchRelationFromRoot(name);

            if (!this._related[name] && relation.multiple) {
                this._setRelated(name, this._createRelatedCollection(name));
            }
            return this._related[name] || null;
        }

        return this.__super(name);
    },

    /**
     * Set attribute value
     * @param {object|string} name
     * @param {*} [value]
     */
    set(name, value) {
        if (this.hasRelation(name)) {
            if (value === null) {
                this._removeRelated(name);
                return;
            }

            this._fetchRelationFromRoot(name);

            if (this._related[name]) {
                this._related[name].set(value);
            } else {
                var relation = this.getRelation(name);
                if (relation.multiple) {
                    var models = !_isArray(value) ? [value] : value;
                    this._setRelated(name, this._createRelatedCollection(name, models));
                } else {
                    var model = value;
                    if (!(model instanceof Model)) {
                        var _class = relation.modelClass;

                        /** @typedef {Jii.data.ActiveRecord} model */
                        model = _class.instantiate(value);
                        _class.populateRecord(model, value);
                    }
                    this._setRelated(name, model);
                }
            }
            return;
        }

        this.__super(name, value);
    },

    /**
     * @param {string|string[]} name
     * @param {function} handler
     * @param {*} [data]
     * @param {boolean} [isAppend]
     */
    on(name, handler, data, isAppend) {
        // Multiple names support
        name = this._normalizeEventNames(name);
        if (name.length > 1) {
            _each(name, n => {
                this.on(n, handler, data, isAppend)
            });
            return;
        } else {
            name = name[0];
        }

        // Sub models support: foo[0]
        var collectionFormat = this._detectKeyFormatCollection(name, this.__static.EVENT_CHANGE_NAME);
        if (collectionFormat) {
            var collEventName = collectionFormat.subName || this.__static.EVENT_CHANGE;
            collectionFormat.model.on(collEventName, handler, data, isAppend);
            return;
        }

        // Sub models support: foo.bar
        var modelFormat = this._detectKeyFormatModel(name, this.__static.EVENT_CHANGE_NAME);
        if (modelFormat) {
            this._relatedEvents[modelFormat.name] = this._relatedEvents[modelFormat.name] || [];
            this._relatedEvents[modelFormat.name].push([modelFormat.subName, handler, data, isAppend]);

            if (modelFormat.model) {
                modelFormat.model.on(modelFormat.subName, handler, data, isAppend);
            }
            return;
        }

        // Relation support
        var relationFormat = this._detectKeyFormatRelation(name, this.__static.EVENT_CHANGE_NAME);
        if (relationFormat) {
            var relationEvent = relationFormat.multiple ? Collection.EVENT_CHANGE : this.__static.EVENT_CHANGE;

            this._relatedEvents[relationFormat.name] = this._relatedEvents[relationFormat.name] || [];
            this._relatedEvents[relationFormat.name].push([relationEvent, handler, data, isAppend]);

            if (relationFormat.model) {
                relationFormat.model.on(relationEvent, handler, data, isAppend);
            }
        }

        this.__super(name, handler, data, isAppend);
    },

    /**
     * @param {string|string[]} name
     * @param {function} [handler]
     * @return boolean
     */
    off(name, handler) {
        // Multiple names support
        name = this._normalizeEventNames(name);
        if (name.length > 1) {
            var bool = false;
            _each(name, n => {
                if (this.off(n, handler)) {
                    bool = true;
                }
            });
            return bool;
        } else {
            name = name[0];
        }

        // Sub models support: foo[0]
        var collectionFormat = this._detectKeyFormatCollection(name, this.__static.EVENT_CHANGE_NAME);
        if (collectionFormat) {
            var collEventName = collectionFormat.subName || this.__static.EVENT_CHANGE;
            return collectionFormat.model.off(collEventName, handler);
        }

        // Sub models support: foo.bar
        var modelFormat = this._detectKeyFormatModel(name, this.__static.EVENT_CHANGE_NAME);
        if (modelFormat) {
            if (this._relatedEvents[modelFormat.name]) {
                this._relatedEvents[modelFormat.name] = _filter(this._relatedEvents[modelFormat.name], arr => {
                    return arr[0] !== modelFormat.subName || arr[1] !== handler;
                });
            }

            if (modelFormat.model) {
                return modelFormat.model.off(modelFormat.subName, handler);
            }
        }

        // Relation support
        var relationFormat = this._detectKeyFormatRelation(name, this.__static.EVENT_CHANGE_NAME);
        if (relationFormat) {
            var relationEvent = relationFormat.multiple ? Collection.EVENT_CHANGE : this.__static.EVENT_CHANGE;
            if (this._relatedEvents[relationFormat.name]) {
                this._relatedEvents[relationFormat.name] = _filter(this._relatedEvents[relationFormat.name], arr => {
                    return arr[0] !== relationEvent || arr[1] !== handler;
                });
            }

            if (relationFormat.model) {
                return relationFormat.model.off(relationEvent, handler);
            }
        }

        return this.__super(name, handler);
    },

    /**
     *
     * @param {string} name
     * @param {string} [prefix]
     * @returns {{model: Jii.data.BaseActiveRecord|null, name: string}|null}
     * @protected
     */
    _detectKeyFormatRelation(name, prefix) {
        prefix = prefix || '';

        if (prefix && name.indexOf(prefix) !== 0) {
            return null;
        }
        name = name.substr(prefix.length);

        if (!this.hasRelation(name)) {
            return null;
        }

        var multiple = null;
        this._fetchRelationFromRoot(name);
        if (this._related[name]) {
            multiple = this._related[name] instanceof Collection;
        }
        if (multiple === null) {
            multiple = this.getRelation(name).multiple;
        }

        return {
            model: this.get(name),
            name: name,
            multiple: multiple
        };
    },

    /**
     *
     * @param {string} name
     * @param value
     * @protected
     */
    _setRelated(name, value) {
        if (this._related[name] && this._related[name] === value) {
            return;
        }
        this._related[name] = value;

        // Attach events
        _each(this._relatedEvents[name] || {}, args => {
            this._related[name].on.apply(this._related[name], args);
        });
        this.trigger(this.__static.EVENT_CHANGE_NAME + name, new ChangeAttributeEvent({
            attribute: name,
            oldValue: null,
            newValue: value,
            isRelation: true
        }));
    },

    /**
     *
     * @param {string} name
     * @protected
     */
    _removeRelated(name) {
        var oldValue = this._related[name];
        if (!oldValue) {
            return;
        }
        delete this._related[name];

        // Detach events
        _each(this._relatedEvents[name] || {}, args => {
            oldValue.off(args[0], args[1]);
        });
        this.trigger(this.__static.EVENT_CHANGE_NAME + name, new ChangeAttributeEvent({
            attribute: name,
            oldValue: oldValue,
            newValue: null,
            isRelation: true
        }));

        oldValue.off(this.__static.EVENT_CHANGE, {
            callback: this._onChangeRelatedModel,
            context: this
        });
    },

	/**
	 *
	 * @param {string} name
	 * @returns {boolean}
	 */
	hasAttribute(name) {
		return _has(this._attributes, name) || _indexOf(this.attributes(), name) !== -1;
	},

	/**
	 * Returns the old attribute values.
	 * @returns {object} the old attribute values (name-value pairs)
	 */
	getOldAttributes() {
		return this._oldAttributes || {};
	},

	/**
	 * Sets the old attribute values.
	 * All existing old attribute values will be discarded.
	 * @param {{}|null} values old attribute values to be set.
	 * If set to `null` this record is considered to be [[isNewRecord|new]].
	 */
	setOldAttributes(values) {
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
	getOldAttribute(name) {
		return _has(this._oldAttributes, name) ? this._oldAttributes[name] : null;
	},

	/**
	 * Sets the old value of the named attribute.
	 * @param {string} name the attribute name
	 * @param {*} value the old attribute value.
	 * @throws {Jii.exceptions.InvalidParamException} if the named attribute does not exist.
	 * @see hasAttribute()
	 */
	setOldAttribute(name, value) {
		if (_has(this._oldAttributes, name) || this.hasAttribute(name)) {
			if (this._oldAttributes === null) {
				this._oldAttributes = {};
			}
			this._oldAttributes[name] = value;
		}

		throw new InvalidParamException(this.className() + ' has no attribute named "' + name + '".');
	},

	/**
	 * Marks an attribute dirty.
	 * This method may be called to force updating a record when calling [[update()]],
	 * even if there is no change being made to the record.
	 * @param {string} name the attribute name
	 */
	markAttributeDirty(name) {
		delete this._oldAttributes[name];
	},

	/**
	 * Returns a value indicating whether the named attribute has been changed.
	 * @param {string} name the name of the attribute
	 * @returns {boolean} whether the attribute has been changed
	 */
	isAttributeChanged(name) {
		if (_has(this._attributes, name) && this._oldAttributes && _has(this._oldAttributes, name)) {
			return !_isEqual(this._attributes[name], this._oldAttributes[name]);
		}

		return _has(this._attributes, name) || (this._oldAttributes && _has(this._oldAttributes, name));
	},

	/**
	 * Returns the attribute values that have been modified since they are loaded or saved most recently.
	 * @param {string[]|null} names the names of the attributes whose values may be returned if they are
	 * changed recently. If null, [[attributes()]] will be used.
	 * @returns {object} the changed attribute values (name-value pairs)
	 */
	getDirtyAttributes(names) {
		names = names || null;

		if (names === null) {
			names = this.attributes();
		}

		var attributes = {};
		_each(this._attributes, (value, name) => {
			if (_indexOf(names, name) === -1) {
				return;
			}

			if (this._oldAttributes === null || !_has(this._oldAttributes, name) || !_isEqual(this._oldAttributes[name], value)) {
				attributes[name] = value;
			}
		});

		return attributes;
	},

	/**
	 * Returns the list of all attribute names of the model.
	 * The default implementation will return all column names of the table associated with this AR class.
	 * @return {string[]} list of attribute names.
	 */
	attributes() {
		return _keys(this.__static.getTableSchema().columns);
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
	save(runValidation, attributeNames) {
		runValidation = runValidation !== false;
		attributeNames = attributeNames || null;

		if (this.isNewRecord()) {
			return this.insert(runValidation, attributeNames);
		} else {
			return this.update(runValidation, attributeNames).then(result => {
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
	insert(runValidation, attributeNames) {

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
	update(runValidation, attributeNames) {
		runValidation = runValidation !== false;
		attributeNames = attributeNames || null;

		var validatePromise = runValidation ? this.validate(attributeNames) : Promise.resolve(true);
		return validatePromise.then(isValid => {
			if (!isValid) {
				return false;
			}

			return this._updateInternal(attributeNames);
		});
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
	updateAttributes(attributes) {
		var attrs = [];
		_each(attributes, (value, name) => {
			if (_isNumber(name)) {
				attrs.push(value);
			} else {
				this.set(name, value);
				attrs.push(name);
			}
		});

		var values = this.getDirtyAttributes(attrs);
		if (_isEmpty(values)) {
			return Promise.resolve(0);
		}

		var oldPrimaryKey = this.getOldPrimaryKey(true);

		return this.__static.updateAll(values, oldPrimaryKey)
			.then(rows => {
				_each(values, (value, name) => {
					this._oldAttributes[name] = this._attributes[name];
				});

				return rows;
			});
	},

	/**
	 * @see update()
	 * @param {[]} [attributes] attributes to update
	 * @returns {Promise.<number>} number of rows updated
	 * @throws StaleObjectException
	 */
	_updateInternal(attributes) {
        attributes = attributes || null;

		var values = null;

		return this.beforeSave(false).then(bool => {
            if (!bool) {
                return Promise.resolve(false);
            }

            values = this.getDirtyAttributes(attributes);

            if (_isEmpty(values)) {
                return this.afterSave(false, values).then(() => {
                    return 0;
                });
            }

            return this.__static.getDb().createCommand().updateModel(this, values);
        }).then(rows => {

			var changedAttributes = {};
			_each(values, (value, name) => {
				changedAttributes[name] = _has(this._oldAttributes, name) ? this._oldAttributes[name] : null;
				this._oldAttributes[name] = value;
			});

			return this.afterSave(false, changedAttributes).then(() => {
				return rows;
			});
		});
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
	updateCounters(counters) {
		var oldPrimaryKey = this.getOldPrimaryKey(true);
		return this.__static.updateAllCounters(_clone(counters), oldPrimaryKey)
			.then(affectedRows => {
				if (affectedRows === 0) {
					return Promise.resolve(false);
				}

				_each(counters, (value, name) => {
					this._attributes[name] += value;
					this._oldAttributes[name] = this._attributes[name];
				});
				return Promise.resolve(true);
			});
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
	delete() {
		return this.beforeDelete().then(bool => {
			if (!bool) {
				return Promise.resolve(false);
			}

			var condition = this.getOldPrimaryKey(true);

			// we do not check the return value of deleteAll() because it's possible
			// the record is already deleted in the database and thus the method will return 0
			return this.__static.deleteAll(condition);
		}).then(result => {

			this._oldAttributes = null;

			return this.afterDelete().then(() => {
				return result;
			});
		});
	},

	/**
	 * Returns a value indicating whether the current record is new.
	 * @returns {boolean} whether the record is new and() should be inserted when calling [[save()]].
	 */
	isNewRecord() {
		return this._oldAttributes === null;
	},

	/**
	 * Sets the value indicating whether the record is new.
	 * @param {boolean} value whether the record is new and() should be inserted when calling [[save()]].
	 * @see isNewRecord()
	 */
	setIsNewRecord(value) {
		this._oldAttributes = value ? null : _clone(this._attributes);
	},

	/**
	 * This method is called when the AR object is created and populated with the query result.
	 * The default implementation will trigger an [[EVENT_AFTER_FIND]] event.
	 * When overriding this method, make sure you call the parent implementation to ensure the
	 * event is triggered.
	 */
	afterFind() {
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
	beforeSave(insert) {
		var event = new ModelEvent();
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
	 * @param {object} changedAttributes The old values of attributes that had changed and were saved.
	 * You can use this parameter to take action based on the changes made for example send an email
	 * when the password had changed or implement audit trail that tracks all the changes.
	 * `changedAttributes` gives you the old attribute values while the active record (`this`) has
	 * already the new, updated values.
	 */
	afterSave(insert, changedAttributes) {
		var eventName = insert ? this.__static.EVENT_AFTER_INSERT : this.__static.EVENT_AFTER_UPDATE;

		this.trigger(eventName, new AfterSaveEvent({
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
	beforeDelete() {
		var event = new ModelEvent();
		this.trigger(this.__static.EVENT_BEFORE_DELETE, event);

		return Promise.resolve(event.isValid);
	},

	/**
	 * This method is invoked after deleting a record.
	 * The default implementation raises the [[EVENT_AFTER_DELETE]] event.
	 * You may override this method to do postprocessing after the record is deleted.
	 * Make sure you call the parent implementation so that the event is raised properly.
	 */
	afterDelete() {
		this.trigger(this.__static.EVENT_AFTER_DELETE);
		return Promise.resolve();
	},

	/**
	 * Repopulates this active record with the latest data.
	 * @returns {boolean} whether the row still exists in the database. If true, the latest data
	 * will be populated to this active record. Otherwise, this record will remain unchanged.
	 */
	refresh() {
		var primaryKey = this.getPrimaryKey(true);

		return this.__static.findOne(primaryKey).then(record => {
			if (record === null) {
				return Promise.resolve(false);
			}

			_each(this.attributes(), name => {
				this._attributes[name] = _has(record._attributes, name) ? record._attributes[name] : null;
			});
			this._oldAttributes = _clone(this._attributes);

            _each(this._related, (relation, name) => {
                this._removeRelated(name);
            });

			return Promise.resolve(true);
		});
	},

	/**
	 * Returns a value indicating whether the given active record is the same as the current one.
	 * The comparison is made by comparing the table names and the primary key values of the two active records.
	 * If one of the records [[isNewRecord|is new]] they are also considered not equal.
	 * @param {Jii.data.BaseActiveRecord} record record to compare to
	 * @returns {boolean} whether the two active records refer to the same row in the same database table.
	 */
	equals(record) {
		if (this.isNewRecord() || record.isNewRecord()) {
			return false;
		}

		if (this.className() !== record.className()) {
			return false;
		}

		return this.getPrimaryKey().toString() === record.getPrimaryKey().toString();
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
	getPrimaryKey(asArray) {
		asArray = asArray || false;

		var keys = this.__static.primaryKey();
		if (keys.length === 1 && !asArray) {
			return _has(this._attributes, keys[0]) ? this._attributes[keys[0]] : null;
		}

		var values = {};
		_each(keys, name => {
			values[name] = _has(this._attributes, name) ? this._attributes[name] : null;
		});

		return values;
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
	getOldPrimaryKey(asArray) {
		asArray = asArray || false;

		var keys = this.__static.primaryKey();

		if (keys.length === 1 && !asArray) {
			return _has(this._oldAttributes, keys[0]) ? this._oldAttributes[keys[0]] : null;
		}

		var values = {};
		_each(keys, name => {
			values[name] = _has(this._oldAttributes, name) ? this._oldAttributes[name] : null;
		});

		return values;
	},

	/**
	 * Returns the relation object with the specified name.
	 * A relation is defined by a getter method which returns an [[ActiveQueryInterface]] object.
	 * It can be declared in either the Active Record class itself or one of its behaviors.
	 * @param {string} name the relation name
	 * @param {boolean} [throwException] whether to throw exception if the relation does not exist.
	 * @returns {Promise.<Jii.data.ActiveQuery>} the relational query object. If the relation does not exist
	 * and `throwException` is false, null will be returned.
	 * @throws {Jii.exceptions.InvalidParamException} if the named relation does not exist.
	 */
	getRelation(name, throwException) {
		throwException = !_isUndefined(throwException) ? throwException : true;

		var getter = 'get' + _upperFirst(name);
		if (_isFunction(this[getter])) {
			return this[getter]();
		} else if (throwException) {
			throw new InvalidParamException(this.className() + ' has no relation named `' + name + '`.');
		}

		return null;
	},

    /**
     *
     * @param {string} name
     * @returns {boolean}
     */
    hasRelation(name) {
        var getter = 'get' + _upperFirst(name);
        return _isFunction(this[getter]);
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
	 * @param {object} [extraColumns] additional column values to be saved into the pivot table.
	 * This parameter is only meaningful for a relationship involving a pivot table
	 * (i.e., a relation set with [[ActiveRelationTrait.via()]] or `[[ActiveQuery.viaTable()]]`.)
	 * @returns {Promise}
	 * @throws {Jii.exceptions.InvalidCallException} if the method is unable to link two models.
	 */
	link(name, model, extraColumns) {
		extraColumns = extraColumns || {};

		var relation = this.getRelation(name);

		return Promise.resolve().then(() => {
			if (relation.getVia() !== null) {
				if (this.isNewRecord() || model.isNewRecord()) {
					throw new InvalidCallException('Unable to link models: both models must NOT be newly created.');
				}

				var viaName = null;
				var viaRelation = null;
				var viaClass = null;
				var viaTable = null;

				if (_isArray(relation.getVia())) {
					/** @type {Jii.data.BaseActiveRecord} */
					viaName = relation.getVia()[0];
					viaRelation = relation.getVia()[1];

					/** @type {Jii.data.BaseActiveRecord} */
					viaClass = viaRelation.modelClass;

					// unset viaName so that it can be reloaded to reflect the change
                    this._removeRelated(viaName);
				} else {
					viaRelation = relation.getVia();
					viaTable = _first(relation.getVia().getFrom());
				}

				var columns = {};
				_each(viaRelation.link, (b, a) => {
					columns[a] = this.get(b);
				});
				_each(relation.link, (b, a) => {
					columns[b] = model.get(a);
				});
				_each(extraColumns, (v, k) => {
					columns[k] = v;
				});

				if (_isArray(relation.getVia())) {
					/** @type {Jii.data.BaseActiveRecord} */
					var record = new viaClass();
					_each(columns, (value, column) => {
						record.set(column, value);
					});
					return record.insert(false);
				}

				/* @type {viaTable} string */
				return this.__static.getDb().createCommand().insert(viaTable, columns);
			}

			var p1 = model.__static.isPrimaryKey(_keys(relation.link));
			var p2 = this.__static.isPrimaryKey(_values(relation.link));
			if (p1 && p2) {
				if (this.isNewRecord() && model.isNewRecord()) {
					throw new InvalidCallException('Unable to link models: both models are newly created.');
				} else if (this.isNewRecord()) {
					var link = {};
					for (var fk in relation.link) {
						if (relation.link.hasOwnProperty(fk)) {
							link[relation.link[fk]] = fk;
						}
					}
					return this._bindModels(link, this, model);
				} else {
					return this._bindModels(relation.link, model, this);
				}
			} else if (p1) {
				var link2 = {};
				for (var fk2 in relation.link) {
					if (relation.link.hasOwnProperty(fk2)) {
						link2[relation.link[fk2]] = fk2;
					}
				}
				return this._bindModels(link2, this, model);
			} else if (p2) {
				return this._bindModels(relation.link, model, this);
			} else {
				throw new InvalidCallException('Unable to link models: the link does not involve any primary key.');
			}
		}).then(() => {
			// update lazily loaded related objects
			if (!relation.multiple) {
                this._setRelated(name, model);
			} else if (_has(this._related, name)) {
                this._related[name].add(model);
            }

			return Promise.resolve();
		});
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
	unlink(name, model, isDelete) {
		isDelete = isDelete || false;

		var relation = this.getRelation(name);

		return Promise.resolve().then(() => {

			if (relation.getVia() !== null) {

				var viaName = null;
				var viaRelation = null;
				var viaClass = null;
				var viaTable = null;

				if (_isArray(relation.getVia())) {
					/** @type {Jii.data.BaseActiveRecord} */
					viaName = relation.getVia()[0];
					viaRelation = relation.getVia()[1];

					/** @type {Jii.data.BaseActiveRecord} */
					viaClass = viaRelation.modelClass;

                    this._removeRelated(viaName);
				} else {
					viaRelation = relation.getVia();
					viaTable = _first(relation.getVia().getFrom());
				}

				var columns = {};
				var nulls = {};
				_each(viaRelation.link, (b, a) => {
					columns[a] = this.get(b);
				});
				_each(relation.link, (b, a) => {
					columns[b] = model.get(a);
				});
				_each(_keys(columns), (k) => {
					nulls[k] = null;
				});

				if (_isArray(relation.getVia())) {
					if (isDelete) {
						return viaClass.deleteAll(columns);
					}

					return viaClass.updateAll(nulls, columns);
				}

				/* @type Jii.data.Command */
				var command = this.__static.getDb().createCommand();
				if (isDelete) {
					return command.delete(viaTable, columns);
				}

				return command.update(viaTable, nulls, columns);
			}

			var p1 = model.__static.isPrimaryKey(_keys(relation.link));
			var p2 = this.__static.isPrimaryKey(_values(relation.link));

			if (p1 && p2 || p2) {
				_each(relation.link, (b, a) => {
					model.set(a, null);
				});

				return isDelete ? model.delete() : model.save(false);
			}

			if (p1) {
				_each(relation.link, (b, a) => {
					var values = this.get(b);

					if (_isArray(values)) { // relation via array valued attribute
						var index = _indexOf(values, model.get(a));
						if (index !== -1) {
							values.splice(index, 1);
						}
					} else {
						this.set(b, null);
					}
				});

				return isDelete ? this.delete() : this.save(false);
			}

			throw new InvalidCallException('Unable to unlink models: the link does not involve any primary key.');
		}).then(() => {
				if (!relation.multiple) {
                    this._removeRelated(name);
					return;
				}

				if (_has(this._related, name)) {
					this._related[name].remove(model);
				}
		});
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
	unlinkAll(name, isDelete) {
		isDelete = isDelete || false;

		var relation = this.getRelation(name);

		return Promise.resolve().then(() => {

			if (relation.getVia() !== null) {

				var viaName = null;
				var viaRelation = null;
				var viaClass = null;
				var viaTable = null;

				if (_isArray(relation.getVia())) {
					/** @type {Jii.data.BaseActiveRecord} */
					viaName = relation.getVia()[0];
					viaRelation = relation.getVia()[1];

					/** @type {Jii.data.BaseActiveRecord} */
					viaClass = viaRelation.modelClass;

                    this._removeRelated(viaName);
				} else {
					viaRelation = relation.getVia();
					viaTable = _first(relation.getVia().getFrom());
				}

				var condition = {};
				var nulls = {};
				_each(viaRelation.link, (b, a) => {
					nulls[a] = null;
					condition[a] = this.get(b);
				});

				if (_isArray(relation.getVia())) {
					if (isDelete) {
						return viaClass.deleteAll(condition);
					}
					return viaClass.updateAll(nulls, condition);
				}

				/** @type {Jii.data.Command} */
				var command = this.__static.getDb().createCommand();
				if (isDelete) {
					return command.delete(viaTable, condition);
				}

				return command.update(viaTable, nulls, condition);
			}

			/** @typedef {Jii.data.BaseActiveRecord} relatedModel */
			var relatedModel = relation.modelClass;
			var key = relation.link[0];
			if (!isDelete && relation.link.length == 1 && _isArray(this.get(key))) {
				// relation via array valued attribute
				this.set(key, []);
				return this.save(false);
			} else {
				var nulls2 = {};
				var condition2 = {};

				_each(relation.link, (b, a) => {
					nulls2[a] = null;
					condition2[a] = this.get(b);
				});
				if (relation.getWhere()) {
					condition2 = ['and', condition2, relation.getWhere()];
				}

				if (isDelete) {
					return relatedModel.deleteAll(condition2);
				}
				return relatedModel.updateAll(nulls2, condition2);
			}
		}).then(() => {
            this._removeRelated(name);
		});
	},

	/**
	 * @param {object} link
	 * @param {Jii.data.BaseActiveRecord} foreignModel
	 * @param {Jii.data.BaseActiveRecord} primaryModel
	 * @throws {Jii.exceptions.InvalidCallException}
	 * @returns {Promise}
	 */
	_bindModels(link, foreignModel, primaryModel) {
		_each(link, (pk, fk) => {
			var value = primaryModel.get(pk);
			if (value === null) {
				throw new InvalidCallException('Unable to link models: the primary key of `' + primaryModel.className() + '` is null.');
			}

			if (_isArray(foreignModel.get(fk))) { // relation via array valued attribute
				foreignModel.get(fk).concat(value);
			} else {
				foreignModel.set(fk, value);
			}
		});

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
	getAttributeLabel(attribute) {
		var labels = this.attributeLabels();

		if (_has(labels, attribute)) {
			return labels[attribute];
		}

		if (attribute.indexOf('.') !== -1) {
			var attributeParts = attribute.split('.');
			var neededAttribute = attributeParts.pop();

			var relatedModel = this;
			_each(attributeParts, relationName => {
				this._fetchRelationFromRoot(relationName);

				if (_has(this._related, relationName) && _isFunction(this._related[relationName].attributeLabels)) {
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
			});

			labels = relatedModel.attributeLabels();

			if (_has(labels, neededAttribute)) {
				return labels[neededAttribute];
			}
		}

		return this.generateAttributeLabel(attribute);
	},

    /*destroy: function() {
        this.__super();

        this._relatedEvents = {};
        _each(this._relatedFetched, function(bool, relationName) {
            var relation = this.getRelation(relationName);
            var modelClassName = Jii.namespace(relation.modelClass).className();
            var rootCollection = this.__static.getDb() ? this.__static.getDb().getRootCollection(modelClassName) : null;
            if (rootCollection) {
                // @todo Implement EVENT_ALL
                //rootCollection.off(Event.EVENT_ALL, this);

                _each(rootCollection._events, function(handlers, name) {
                    rootCollection.off(name, {
                        callback: this._onChangeRelatedModel,
                        context: this
                    });
                }.bind(this));
            }
        });
    },*/

    /**
     *
     * @param {string} relationName
     * @param {object[]|Jii.base.Model[]} [items]
     * @returns {Jii.base.Collection}
     * @private
     */
    _createRelatedCollection(relationName, items) {
        items = items || [];

        var relation = this.getRelation(relationName);

        var collection = null;
        var rootCollection = this.__static.getDb() ? this.__static.getDb().getRootCollection(relation.modelClass) : null;

        if (rootCollection) {
            collection = rootCollection.createChild();
            collection.setFilter(relation);
        } else {
            collection = new Collection([], {modelClass: relation.modelClass});
        }

        collection.setModels(items);
        return collection;
    },

    _fetchRelationFromRoot(name) {
        if (this._relatedFetched[name]) {
            return;
        }
        this._relatedFetched[name] = true;

        var db = this.__static.getDb();
        if (!db) {
            return;
        }

        var relation = this.getRelation(name);
        if (relation.multiple === true) {
            return;
        }

        var modelClassName = Jii.namespace(relation.modelClass);
        var rootCollection = db.getRootCollection(modelClassName);
        if (!rootCollection) {
            return;
        }

        var model = rootCollection.find(relation);
        if (model) {
            this._setRelated(name, model);
        }

        // Subscribe on change relation data
        var affectedAttributes = db.getSchema().getFilterBuilder().attributes(relation);
        if (affectedAttributes.length > 0) {
            rootCollection.on(
                [
                    Collection.EVENT_CHANGE
                ].concat(
                    _map(affectedAttributes, attribute => {
                        return Collection.EVENT_CHANGE_NAME + attribute;
                    })
                ),
                {
                    callback: this._onChangeRelatedModel,
                    context: this
                },
                {
                    relationName: name
                }
            );
        }
    },

    /**
     *
     * @param {Jii.data.ChangeEvent} event
     * @private
     */
    _onChangeRelatedModel(event) {
        /** @type {Jii.base.Model} model */
        var model = event.sender;
        var name = event.data.relationName;

        if (!name) {
            throw new InvalidParamException('Not found relationName in event handler.');
        }

        // Skip left events
        if (this._related[name] && this._related[name] !== model) {
            return;
        }

        var relation = this.getRelation(name);
        var modelClassName = Jii.namespace(relation.modelClass);
        var rootCollection = this.__static.getDb().getRootCollection(modelClassName);

        var newModel = rootCollection.find(relation);
        if (newModel) {
            this._setRelated(name, newModel);
        } else {
            this._removeRelated(name);
        }
    }

});

module.exports = BaseActiveRecord;