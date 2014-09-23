'use strict';

require('../../../../framework/require-server');
require('./DatabaseTestCase.js');

/**
 * @class tests.unit.QueryBuilderTest
 * @extends tests.unit.DatabaseTestCase
 */
var self = Jii.defineClass('tests.unit.QueryBuilderTest', {

	__extends: tests.unit.DatabaseTestCase,

	__static: {
	},

	/**
	 * @throws \Exception
	 * @returns {Jii.data.sql.QueryBuilder}
	 */
	_getQueryBuilder: function () {
		var queryBuilder = null;

		switch (this.driverName) {
			case 'mysql':
				queryBuilder = new Jii.data.sql.mysql.QueryBuilder();
				break;

			/*case 'sqlite':
				return new SqliteQueryBuilder(this.getConnection(true, false));
			case 'mssql':
				return new MssqlQueryBuilder(this.getConnection(true, false));
			case 'pgsql':
				return new PgsqlQueryBuilder(this.getConnection(true, false));
			case 'cubrid':
				return new CubridQueryBuilder(this.getConnection(true, false));*/

			default:
				throw new Jii.exceptions.ApplicationException('Test is not implemented for ' + this.driverName);
		}

		return this.getConnection(true, false).then(function(db) {
			queryBuilder.db = db;
			return queryBuilder;
		}).catch(Jii.catchHandler());
	},

	/**
	 * this is not used as a dataprovider for testGetColumnType to speed up the test
	 * when used as dataprovider every single line will cause a reconnect with the database which is not needed here
	 */
	columnTypes: function () {
		return [
			[Jii.data.sql.BaseSchema.TYPE_PK, 'int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY'],
			[Jii.data.sql.BaseSchema.TYPE_PK + '(8)', 'int(8) NOT NULL AUTO_INCREMENT PRIMARY KEY'],
			[Jii.data.sql.BaseSchema.TYPE_PK + ' CHECK (value > 5)', 'int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY CHECK (value > 5)'],
			[Jii.data.sql.BaseSchema.TYPE_PK + '(8) CHECK (value > 5)', 'int(8) NOT NULL AUTO_INCREMENT PRIMARY KEY CHECK (value > 5)'],
			[Jii.data.sql.BaseSchema.TYPE_STRING, 'varchar(255)'],
			[Jii.data.sql.BaseSchema.TYPE_STRING + '(32)', 'varchar(32)'],
			[Jii.data.sql.BaseSchema.TYPE_STRING + ' CHECK (value LIKE "test%")', 'varchar(255) CHECK (value LIKE "test%")'],
			[Jii.data.sql.BaseSchema.TYPE_STRING + '(32) CHECK (value LIKE "test%")', 'varchar(32) CHECK (value LIKE "test%")'],
			[Jii.data.sql.BaseSchema.TYPE_STRING + ' NOT NULL', 'varchar(255) NOT NULL'],
			[Jii.data.sql.BaseSchema.TYPE_TEXT, 'text'],
			[Jii.data.sql.BaseSchema.TYPE_TEXT + '(255)', 'text'],
			[Jii.data.sql.BaseSchema.TYPE_TEXT + ' CHECK (value LIKE "test%")', 'text CHECK (value LIKE "test%")'],
			[Jii.data.sql.BaseSchema.TYPE_TEXT + '(255) CHECK (value LIKE "test%")', 'text CHECK (value LIKE "test%")'],
			[Jii.data.sql.BaseSchema.TYPE_TEXT + ' NOT NULL', 'text NOT NULL'],
			[Jii.data.sql.BaseSchema.TYPE_TEXT + '(255) NOT NULL', 'text NOT NULL'],
			[Jii.data.sql.BaseSchema.TYPE_SMALLINT, 'smallint(6)'],
			[Jii.data.sql.BaseSchema.TYPE_SMALLINT + '(8)', 'smallint(8)'],
			[Jii.data.sql.BaseSchema.TYPE_INTEGER, 'int(11)'],
			[Jii.data.sql.BaseSchema.TYPE_INTEGER + '(8)', 'int(8)'],
			[Jii.data.sql.BaseSchema.TYPE_INTEGER + ' CHECK (value > 5)', 'int(11) CHECK (value > 5)'],
			[Jii.data.sql.BaseSchema.TYPE_INTEGER + '(8) CHECK (value > 5)', 'int(8) CHECK (value > 5)'],
			[Jii.data.sql.BaseSchema.TYPE_INTEGER + ' NOT NULL', 'int(11) NOT NULL'],
			[Jii.data.sql.BaseSchema.TYPE_BIGINT, 'bigint(20)'],
			[Jii.data.sql.BaseSchema.TYPE_BIGINT + '(8)', 'bigint(8)'],
			[Jii.data.sql.BaseSchema.TYPE_BIGINT + ' CHECK (value > 5)', 'bigint(20) CHECK (value > 5)'],
			[Jii.data.sql.BaseSchema.TYPE_BIGINT + '(8) CHECK (value > 5)', 'bigint(8) CHECK (value > 5)'],
			[Jii.data.sql.BaseSchema.TYPE_BIGINT + ' NOT NULL', 'bigint(20) NOT NULL'],
			[Jii.data.sql.BaseSchema.TYPE_FLOAT, 'float'],
			[Jii.data.sql.BaseSchema.TYPE_FLOAT + '(16,5)', 'float'],
			[Jii.data.sql.BaseSchema.TYPE_FLOAT + ' CHECK (value > 5.6)', 'float CHECK (value > 5.6)'],
			[Jii.data.sql.BaseSchema.TYPE_FLOAT + '(16,5) CHECK (value > 5.6)', 'float CHECK (value > 5.6)'],
			[Jii.data.sql.BaseSchema.TYPE_FLOAT + ' NOT NULL', 'float NOT NULL'],
			[Jii.data.sql.BaseSchema.TYPE_DECIMAL, 'decimal(10,0)'],
			[Jii.data.sql.BaseSchema.TYPE_DECIMAL + '(12,4)', 'decimal(12,4)'],
			[Jii.data.sql.BaseSchema.TYPE_DECIMAL + ' CHECK (value > 5.6)', 'decimal(10,0) CHECK (value > 5.6)'],
			[Jii.data.sql.BaseSchema.TYPE_DECIMAL + '(12,4) CHECK (value > 5.6)', 'decimal(12,4) CHECK (value > 5.6)'],
			[Jii.data.sql.BaseSchema.TYPE_DECIMAL + ' NOT NULL', 'decimal(10,0) NOT NULL'],
			[Jii.data.sql.BaseSchema.TYPE_DATETIME, 'datetime'],
			[Jii.data.sql.BaseSchema.TYPE_DATETIME + " CHECK(value BETWEEN '2011-01-01' AND '2013-01-01')", "datetime CHECK(value BETWEEN '2011-01-01' AND '2013-01-01')"],
			[Jii.data.sql.BaseSchema.TYPE_DATETIME + ' NOT NULL', 'datetime NOT NULL'],
			[Jii.data.sql.BaseSchema.TYPE_TIMESTAMP, 'timestamp'],
			[Jii.data.sql.BaseSchema.TYPE_TIMESTAMP + " CHECK(value BETWEEN '2011-01-01' AND '2013-01-01')", "timestamp CHECK(value BETWEEN '2011-01-01' AND '2013-01-01')"],
			[Jii.data.sql.BaseSchema.TYPE_TIMESTAMP + ' NOT NULL', 'timestamp NOT NULL'],
			[Jii.data.sql.BaseSchema.TYPE_TIME, 'time'],
			[Jii.data.sql.BaseSchema.TYPE_TIME + " CHECK(value BETWEEN '12:00:00' AND '13:01:01')", "time CHECK(value BETWEEN '12:00:00' AND '13:01:01')"],
			[Jii.data.sql.BaseSchema.TYPE_TIME + ' NOT NULL', 'time NOT NULL'],
			[Jii.data.sql.BaseSchema.TYPE_DATE, 'date'],
			[Jii.data.sql.BaseSchema.TYPE_DATE + " CHECK(value BETWEEN '2011-01-01' AND '2013-01-01')", "date CHECK(value BETWEEN '2011-01-01' AND '2013-01-01')"],
			[Jii.data.sql.BaseSchema.TYPE_DATE + ' NOT NULL', 'date NOT NULL'],
			[Jii.data.sql.BaseSchema.TYPE_BINARY, 'blob'],
			[Jii.data.sql.BaseSchema.TYPE_BOOLEAN, 'tinyint(1)'],
			[Jii.data.sql.BaseSchema.TYPE_BOOLEAN + ' NOT NULL DEFAULT 1', 'tinyint(1) NOT NULL DEFAULT 1'],
			[Jii.data.sql.BaseSchema.TYPE_MONEY, 'decimal(19,4)'],
			[Jii.data.sql.BaseSchema.TYPE_MONEY + '(16,2)', 'decimal(16,2)'],
			[Jii.data.sql.BaseSchema.TYPE_MONEY + ' CHECK (value > 0.0)', 'decimal(19,4) CHECK (value > 0.0)'],
			[Jii.data.sql.BaseSchema.TYPE_MONEY + '(16,2) CHECK (value > 0.0)', 'decimal(16,2) CHECK (value > 0.0)'],
			[Jii.data.sql.BaseSchema.TYPE_MONEY + ' NOT NULL', 'decimal(19,4) NOT NULL']
		];
	},

	testGetColumnType: function (test) {
		this._getQueryBuilder().then(function(queryBuilder) {
			_.each(this.columnTypes(), function(item) {
				var column = item[0];
				var expected = item[1];

				test.strictEqual(queryBuilder.getColumnType(column), expected);
			});

			test.done();
		}.bind(this));
	},

	testCreateTableColumnTypes: function (test) {
		var columns = {};
		var queryBuilder = null;

		this._getQueryBuilder().then(function(qb) {
			queryBuilder = qb;
			return queryBuilder.db.getTableSchema('column_type_table', true);
		}).then(function(table) {
			if (table !== null) {
				// Clear
				return this.getConnection(false).then(function(db) {
					return db.createCommand(queryBuilder.dropTable('column_type_table')).execute();
				});
			}

			return Promise.resolve();
		}.bind(this)).then(function() {
			var i = 1;
			_.each(this.columnTypes(), function(item) {
				var column = item[0];

				if (column.substr(0, 2) !== 'pk') {
					columns['col' + i++] = column.replace('CHECK (value', 'CHECK (col' + i);
				}
			});

			// Create new
			return this.getConnection(false).then(function(db) {
				return db.createCommand(queryBuilder.createTable('column_type_table', columns)).execute();
			});
		}.bind(this)).then(function() {

			// Check created
			return queryBuilder.db.getTableSchema('column_type_table', true);
		}.bind(this)).then(function(table) {
			test.notStrictEqual(table, null);

			_.each(table.columns, function(column, name) {
				test.strictEqual(column instanceof Jii.data.sql.ColumnSchema, true);
				test.strictEqual(_.has(columns, name), true);
				test.strictEqual(column.name, name);
			});

			test.done();
		});
	},

	testBuildCondition: function (test) {
		var conditions = [
			// empty values
			[ ['like', 'name', []], '0=1', [] ],
			[ ['not like', 'name', []], '', [] ],
			[ ['or like', 'name', []], '0=1', [] ],
			[ ['or not like', 'name', []], '', [] ],

			// simple like
			[ ['like', 'name', 'heyho'], '"name" LIKE :qp0', {':qp0': '%heyho%'} ],
			[ ['not like', 'name', 'heyho'], '"name" NOT LIKE :qp0', {':qp0': '%heyho%'} ],
			[ ['or like', 'name', 'heyho'], '"name" LIKE :qp0', {':qp0': '%heyho%'} ],
			[ ['or not like', 'name', 'heyho'], '"name" NOT LIKE :qp0', {':qp0': '%heyho%'} ],

			// like for many values
			[ ['like', 'name', ['heyho', 'abc']], '"name" LIKE :qp0 AND "name" LIKE :qp1', {':qp0': '%heyho%', ':qp1': '%abc%'} ],
			[ ['not like', 'name', ['heyho', 'abc']], '"name" NOT LIKE :qp0 AND "name" NOT LIKE :qp1', {':qp0': '%heyho%', ':qp1': '%abc%'} ],
			[ ['or like', 'name', ['heyho', 'abc']], '"name" LIKE :qp0 OR "name" LIKE :qp1', {':qp0': '%heyho%', ':qp1': '%abc%'} ],
			[ ['or not like', 'name', ['heyho', 'abc']], '"name" NOT LIKE :qp0 OR "name" NOT LIKE :qp1', {':qp0': '%heyho%', ':qp1': '%abc%'} ]

			// TODO add more conditions
			// IN
			// NOT
			// ...
		];

		// adjust dbms specific escaping
		if (_.indexOf(['mssql', 'mysql', 'sqlite'], this.driverName) !== -1) {
			_.each(conditions, function(condition, i) {
				conditions[i][1] = condition[1].replace(/"/g, '`');
			});
		}

		this._getQueryBuilder().then(function(queryBuilder) {
			_.each(conditions, function(item) {
				var condition = item[0];
				var expected = item[1];
				var expectedParams = item[2];

				var query = (new Jii.data.sql.Query()).where(condition);
				var buildParams = queryBuilder.build(query);
				var sql = buildParams[0];
				var params = buildParams[1];

				test.deepEqual(params, expectedParams);
				test.equals(sql, 'SELECT *' + (_.isEmpty(expected) ? '' : ' WHERE ' + expected));
			}.bind(this));

			test.done();
		});
	},

	testAddDropPrimaryKey: function (test) {
		var tableName = 'constraints';
		var pkeyName = tableName + "_pkey";
		var queryBuilder = null;

		// ADD
		this._getQueryBuilder().then(function(qb) {
			queryBuilder = qb;
			return queryBuilder.db.createCommand().addPrimaryKey(pkeyName, tableName, ['id']).execute();
		}).then(function() {

			return queryBuilder.db.getSchema().getTableSchema(tableName);
		}).then(function(tableSchema) {
			test.equals(tableSchema.primaryKey.length, 1);

			// DROP
			return queryBuilder.db.createCommand().dropPrimaryKey(pkeyName, tableName).execute();
		}).then(function() {

			// resets the schema
			return this._getQueryBuilder();
		}.bind(this)).then(function(qb) {
			queryBuilder = qb;

			return queryBuilder.db.getSchema().getTableSchema(tableName);
		}).then(function(tableSchema) {
			test.equals(tableSchema.primaryKey.length, 0);
			test.done();
		});
	}

});

module.exports = new self().exports();
