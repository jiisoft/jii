'use strict';

require('../../../../framework/require-server');
require('./DatabaseTestCase.js');

/**
 * @class tests.unit.CommandTest
 * @extends tests.unit.DatabaseTestCase
 */
var self = Jii.defineClass('tests.unit.CommandTest', {

	__extends: tests.unit.DatabaseTestCase,

	__static: {
	},


	testConstruct: function (test) {
		this.getConnection(false).then(function(db) {

			// null
			var command = db.createCommand();
			test.strictEqual(command.getSql(), null);

			// string
			var sql = 'SELECT * FROM customer';
			var command2 = db.createCommand(sql);
			test.strictEqual(command2.getSql(), sql);

			test.done();
		});
	},

	testGetSetSql: function (test) {
		this.getConnection(false).then(function(db) {

			var sql = 'SELECT * FROM customer';
			var command = db.createCommand(sql);
			test.strictEqual(command.getSql(), sql);

			var sql2 = 'SELECT * FROM order';
			command.setSql(sql2);
			test.strictEqual(command.getSql(), sql2);

			test.done();
		});
	},

	testAutoQuoting: function (test) {
		this.getConnection(false).then(function(db) {
			var sql = 'SELECT [[id]], [[t.name]] FROM {{customer}} t';
			var command = db.createCommand(sql);
			test.strictEqual('SELECT `id`, `t`.`name` FROM `customer` t', command.getSql());

			test.done();
		});
	},

	testExecute: function (test) {
		var db = null;

		this.getConnection(false).then(function(d) {
			db = d;

			var sql = 'INSERT INTO customer(email, name , address) VALUES (\'user4@example.com\', \'user4\', \'address4\')';
			var command = db.createCommand(sql);
			return command.execute();
		}).then(function(result) {
			test.strictEqual(result, 1);

			var sql = 'SELECT COUNT(*) FROM customer WHERE name =\'user4\'';
			var command = db.createCommand(sql);
			return command.queryScalar();
		}).then(function(result) {
			test.equal(result, 1);

			var command = db.createCommand('bad SQL');
			return command.execute();
		}).then(function() {

			test.strictEqual(0, 1, 'Not throw exception Jii.data.sql.SqlQueryException.');
			test.done();
		}, function(exception) {

			test.strictEqual(exception instanceof Jii.data.sql.SqlQueryException, true);
			test.done();
		});
	},

	testQuery: function (test) {
		var db = null;

		this.getConnection(true).then(function(d) {
			db = d;

			// queryAll
			return db.createCommand('SELECT * FROM customer').queryAll();
		}).then(function(rows) {
			test.equal(rows.length, 3);
			var row = rows[2];
			test.equal(row.id, 3);
			test.equal(row.name, 'user3');

			// queryAll
			return db.createCommand('SELECT * FROM customer WHERE id=10').queryAll();
		}).then(function(rows) {
			test.equal(rows.length, 0);

			// queryOne
			return db.createCommand('SELECT * FROM customer ORDER BY id').queryOne();
		}).then(function(row) {
			test.equal(row.id, 1);
			test.equal(row.name, 'user1');

			// queryOne
			return db.createCommand('SELECT * FROM customer WHERE id=10').queryOne();
		}).then(function(row) {
			test.strictEqual(row, null);

			// queryColumn
			return db.createCommand('SELECT * FROM customer').queryColumn();
		}).then(function(column) {
			test.deepEqual(column, ['1', '2', '3']);

			// queryColumn
			return db.createCommand('SELECT id FROM customer WHERE id=10').queryColumn();
		}).then(function(column) {
			test.deepEqual(column, []);

			// queryScalar
			return db.createCommand('SELECT * FROM customer ORDER BY id').queryScalar();
		}).then(function(value) {
			test.equal(value, 1);

			// queryScalar
			return db.createCommand('SELECT id FROM customer WHERE id=10').queryScalar();
		}).then(function(value) {
			test.strictEqual(value, null);

			test.done();
		});
	},

	testBindValue: function (test) {
		var db = null;
		var email = 'user5@example.com';

		this.getConnection(true).then(function(d) {
			db = d;

			var sql = 'INSERT INTO customer(email, name, address) VALUES (:email, \'user5\', \'address5\')';
			var command = db.createCommand(sql);
			command.bindValue(':email', 'user5@example.com');
			return command.execute();
		}).then(function(affectedRows) {
			test.strictEqual(affectedRows, 1);

			var sql = 'SELECT name FROM customer WHERE email=:email';
			var command = db.createCommand(sql);
			command.bindValue(':email', email);
			return command.queryScalar();
		}).then(function(name) {
			test.equal(name, 'user5');

			test.done();
		});
	},

	testBatchInsert: function (test) {
		this.getConnection(false).then(function(db) {
			var command = db.createCommand();

			command.batchInsert('customer',
				['email', 'name', 'address'], [
					['t1@example.com', 't1', 't1 address'],
					['t2@example.com', null, false]
				]
			);
			return command.execute();
		}).then(function(affectedRows) {
			test.strictEqual(affectedRows, 2);

			test.done();
		});
	},

	testIntegrityViolation: function (test) {
		var command = null;
		this.getConnection(false).then(function(db) {
			command = db.createCommand('INSERT INTO profile(id, description) VALUES (123, \'duplicate\')');

			return command.execute();
		}).then(function() {

			return command.execute();
		}).then(function() {

			test.strictEqual(0, 1, 'Not throw exception Jii.data.sql.IntegrityException.');
			test.done();
		}, function(exception) {

			test.strictEqual(exception instanceof Jii.data.sql.SqlQueryException, true);
			test.done();
		});
	}
});

module.exports = new self().exports();
