'use strict';

var Jii = require('../../BaseJii');
var TableSchema = require('../../data/TableSchema');
var Expression = require('../../data/Expression');
var _each = require('lodash/each');
var _has = require('lodash/has');
var _keys = require('lodash/keys');
var _isArray = require('lodash/isArray');
var _isObject = require('lodash/isObject');
var _indexOf = require('lodash/indexOf');
var DatabaseTestCase = require('../DatabaseTestCase.js');

/**
 * @class tests.unit.QueryBuilderTest
 * @extends tests.unit.DatabaseTestCase
 */
var self = Jii.defineClass('tests.unit.QueryBuilderTest', {

	__extends: DatabaseTestCase,

	testGetTableNames(test) {
		this.getConnection().then(function(db) {
			return db.getSchema().loadTableNames();
		}).then(function(tables) {

			test.notStrictEqual(_indexOf(tables, 'customer'), -1);
			test.notStrictEqual(_indexOf(tables, 'category'), -1);
			test.notStrictEqual(_indexOf(tables, 'item'), -1);
			test.notStrictEqual(_indexOf(tables, 'order'), -1);
			test.notStrictEqual(_indexOf(tables, 'order_item'), -1);
			test.notStrictEqual(_indexOf(tables, 'type'), -1);

			test.done();
		});
	},

	testGetTableSchemas(test) {
		var schema = null;
		var tableSchemas = null;
		var tableNames = null;

		this.getConnection().then(function(db) {
			schema = db.getSchema();

			return schema.loadTableSchemas();
		}).then(function(ts) {
			tableSchemas = ts;

			return schema.loadTableNames();
		}).then(function(tn) {
			tableNames = tn;

			test.equals(tableSchemas.length, tableNames.length);
			_each(tableSchemas, function(table) {
				test.strictEqual(table instanceof TableSchema, true);
			});

			test.done();
		});
	},

	testGetNonExistingTableSchema(test) {
		this.getConnection().then(function(db) {
			db.getSchema().loadTableSchema('nonexisting_table').then(function(table) {
				test.strictEqual(table, null);
				test.done();
			});
		});
	},

	testCompositeFk(test) {
		this.getConnection().then(function(db) {
			var schema = db.getSchema();
			schema.loadTableSchema('composite_fk').then(function(table) {

				test.strictEqual(table.foreignKeys.length, 1);
				test.strictEqual(_has(table.foreignKeys, 0), true);
				test.equal(table.foreignKeys[0][0], 'order_item');
				test.equal(table.foreignKeys[0].order_id, 'order_id');
				test.equal(table.foreignKeys[0].item_id, 'item_id');

				test.done();
			});
		});
	},

	getExpectedColumns() {
		return {
			'int_col': {
				type: 'integer',
				dbType: 'int(11)',
				jsType: 'number',
				allowNull: false,
				autoIncrement: false,
				enumValues: null,
				size: 11,
				precision: 11,
				scale: null,
				defaultValue: null
			},
			'int_col2': {
				type: 'integer',
				dbType: 'int(11)',
				jsType: 'number',
				allowNull: true,
				autoIncrement: false,
				enumValues: null,
				size: 11,
				precision: 11,
				scale: null,
				defaultValue: 1
			},
			'smallint_col': {
				'type': 'smallint',
				'dbType': 'smallint(1)',
				'jsType': 'number',
				'allowNull': true,
				'autoIncrement': false,
				'enumValues': null,
				'size': 1,
				'precision': 1,
				'scale': null,
				'defaultValue': 1
			},
			'char_col': {
				type: 'string',
				dbType: 'char(100)',
				jsType: 'string',
				allowNull: false,
				autoIncrement: false,
				enumValues: null,
				size: 100,
				precision: 100,
				scale: null,
				defaultValue: null
			},
			'char_col2': {
				type: 'string',
				dbType: 'varchar(100)',
				jsType: 'string',
				allowNull: true,
				autoIncrement: false,
				enumValues: null,
				size: 100,
				precision: 100,
				scale: null,
				defaultValue: 'something'
			},
			'char_col3': {
				type: 'text',
				dbType: 'text',
				jsType: 'string',
				allowNull: true,
				autoIncrement: false,
				enumValues: null,
				size: null,
				precision: null,
				scale: null,
				defaultValue: null
			},
			'enum_col': {
				type: 'string',
				dbType: "enum('a','B')",
				jsType: 'string',
				allowNull: true,
				autoIncrement: false,
				enumValues: ['a', 'B'],
				size: null,
				precision: null,
				scale: null,
				defaultValue: null
			},
			'float_col': {
				type: 'float',
				dbType: 'double(4,3)',
				jsType: 'number',
				allowNull: false,
				autoIncrement: false,
				enumValues: null,
				size: 4,
				precision: 4,
				scale: 3,
				defaultValue: null
			},
			'float_col2': {
				type: 'float',
				dbType: 'double',
				jsType: 'number',
				allowNull: true,
				autoIncrement: false,
				enumValues: null,
				size: null,
				precision: null,
				scale: null,
				defaultValue: 1.23
			},
			'blob_col': {
				type: 'binary',
				dbType: 'blob',
				jsType: 'string',
				allowNull: true,
				autoIncrement: false,
				enumValues: null,
				size: null,
				precision: null,
				scale: null,
				defaultValue: null
			},
			'numeric_col': {
				type: 'decimal',
				dbType: 'decimal(5,2)',
				jsType: 'number',
				allowNull: true,
				autoIncrement: false,
				enumValues: null,
				size: 5,
				precision: 5,
				scale: 2,
				defaultValue: 33.22
			},
			'time': {
				type: 'timestamp',
				dbType: 'timestamp',
				jsType: 'string',
				allowNull: false,
				autoIncrement: false,
				enumValues: null,
				size: null,
				precision: null,
				scale: null,
				defaultValue: '2002-01-01 00:00:00'
			},
			'bool_col': {
				type: 'smallint',
				dbType: 'tinyint(1)',
				jsType: 'number',
				allowNull: false,
				autoIncrement: false,
				enumValues: null,
				size: 1,
				precision: 1,
				scale: null,
				defaultValue: null
			},
			'bool_col2': {
				type: 'smallint',
				dbType: 'tinyint(1)',
				jsType: 'number',
				allowNull: true,
				autoIncrement: false,
				enumValues: null,
				size: 1,
				precision: 1,
				scale: null,
				defaultValue: 1
			},
			'ts_default': {
				type: 'timestamp',
				dbType: 'timestamp',
				jsType: 'string',
				allowNull: false,
				autoIncrement: false,
				enumValues: null,
				size: null,
				precision: null,
				scale: null,
				defaultValue: new Expression('CURRENT_TIMESTAMP')
			},
			'bit_col': {
				type: 'smallint',
				dbType: 'bit(8)',
				jsType: 'string',
				allowNull: false,
				autoIncrement: false,
				enumValues: null,
				size: 8,
				precision: 8,
				scale: null,
				defaultValue: Number(130).toString(2)
			}
		};
	},

	testColumnSchema(test) {
		var columns = this.getExpectedColumns();

		this.getConnection().then(function(db) {
			return db.getSchema().loadTableSchema('type', true);
		}).then(function(table) {
			var expectedColNames = _keys(columns).sort();
			var colNames = table.getColumnNames().sort();
			test.deepEqual(colNames, expectedColNames);

			_each(table.columns, function(column, name) {
				var expected = columns[name];

				test.strictEqual(column.dbType, expected.dbType);
				test.strictEqual(column.jsType, expected.jsType);
				test.strictEqual(column.type, expected.type);
				test.strictEqual(column.allowNull, expected.allowNull);
				test.strictEqual(column.autoIncrement, expected.autoIncrement);
				test.strictEqual(column.size, expected.size);
				test.strictEqual(column.precision, expected.precision);
				test.strictEqual(column.scale, expected.scale);

				if (_isArray(expected.enumValues)) {
					test.deepEqual(column.enumValues, expected.enumValues);
				} else {
					test.strictEqual(column.enumValues, expected.enumValues);
				}

				if (_isObject(expected.defaultValue)) {
					test.equal(column.defaultValue.toString(), expected.defaultValue.toString());
				} else {
					test.strictEqual(column.defaultValue, expected.defaultValue);
				}
			});

			test.done();
		});
	}

});

module.exports = new self().exports();
