'use strict';

var Jii = require('../../index');
var BaseSchema = require('../../data/BaseSchema');
var ColumnSchema = require('../../data/ColumnSchema');
var QueryBuilder = require('jii-mysql/QueryBuilder');
var ApplicationException = require('../../exceptions/ApplicationException');
var Expression = require('../../data/Expression');
var Query = require('../../data/Query');
var _each = require('lodash/each');
var _has = require('lodash/has');
var _isEmpty = require('lodash/isEmpty');
var _indexOf = require('lodash/indexOf');
var DatabaseTestCase = require('../DatabaseTestCase.js');
class self extends DatabaseTestCase {

    /**
     * @throws \Exception
     * @returns {Jii.data.QueryBuilder}
     */
    _getQueryBuilder() {
        var queryBuilder = null;

        switch (this.driverName) {
            case 'mysql':
                queryBuilder = new QueryBuilder();
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
                throw new ApplicationException('Test is not implemented for ' + this.driverName);
        }

        return this.getConnection(true, false).then(function(db) {
            queryBuilder.db = db;
            return queryBuilder;
        });
    }

    /**
     * this is not used as a dataprovider for testGetColumnType to speed up the test
     * when used as dataprovider every single line will cause a reconnect with the database which is not needed here
     */
    columnTypes() {
        return [
            [
                BaseSchema.TYPE_PK,
                'int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY'
            ],
            [
                BaseSchema.TYPE_PK + '(8)',
                'int(8) NOT NULL AUTO_INCREMENT PRIMARY KEY'
            ],
            [
                BaseSchema.TYPE_PK + ' CHECK (value > 5)',
                'int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY CHECK (value > 5)'
            ],
            [
                BaseSchema.TYPE_PK + '(8) CHECK (value > 5)',
                'int(8) NOT NULL AUTO_INCREMENT PRIMARY KEY CHECK (value > 5)'
            ],
            [
                BaseSchema.TYPE_STRING,
                'varchar(255)'
            ],
            [
                BaseSchema.TYPE_STRING + '(32)',
                'varchar(32)'
            ],
            [
                BaseSchema.TYPE_STRING + ' CHECK (value LIKE "test%")',
                'varchar(255) CHECK (value LIKE "test%")'
            ],
            [
                BaseSchema.TYPE_STRING + '(32) CHECK (value LIKE "test%")',
                'varchar(32) CHECK (value LIKE "test%")'
            ],
            [
                BaseSchema.TYPE_STRING + ' NOT NULL',
                'varchar(255) NOT NULL'
            ],
            [
                BaseSchema.TYPE_TEXT,
                'text'
            ],
            [
                BaseSchema.TYPE_TEXT + '(255)',
                'text'
            ],
            [
                BaseSchema.TYPE_TEXT + ' CHECK (value LIKE "test%")',
                'text CHECK (value LIKE "test%")'
            ],
            [
                BaseSchema.TYPE_TEXT + '(255) CHECK (value LIKE "test%")',
                'text CHECK (value LIKE "test%")'
            ],
            [
                BaseSchema.TYPE_TEXT + ' NOT NULL',
                'text NOT NULL'
            ],
            [
                BaseSchema.TYPE_TEXT + '(255) NOT NULL',
                'text NOT NULL'
            ],
            [
                BaseSchema.TYPE_SMALLINT,
                'smallint(6)'
            ],
            [
                BaseSchema.TYPE_SMALLINT + '(8)',
                'smallint(8)'
            ],
            [
                BaseSchema.TYPE_INTEGER,
                'int(11)'
            ],
            [
                BaseSchema.TYPE_INTEGER + '(8)',
                'int(8)'
            ],
            [
                BaseSchema.TYPE_INTEGER + ' CHECK (value > 5)',
                'int(11) CHECK (value > 5)'
            ],
            [
                BaseSchema.TYPE_INTEGER + '(8) CHECK (value > 5)',
                'int(8) CHECK (value > 5)'
            ],
            [
                BaseSchema.TYPE_INTEGER + ' NOT NULL',
                'int(11) NOT NULL'
            ],
            [
                BaseSchema.TYPE_BIGINT,
                'bigint(20)'
            ],
            [
                BaseSchema.TYPE_BIGINT + '(8)',
                'bigint(8)'
            ],
            [
                BaseSchema.TYPE_BIGINT + ' CHECK (value > 5)',
                'bigint(20) CHECK (value > 5)'
            ],
            [
                BaseSchema.TYPE_BIGINT + '(8) CHECK (value > 5)',
                'bigint(8) CHECK (value > 5)'
            ],
            [
                BaseSchema.TYPE_BIGINT + ' NOT NULL',
                'bigint(20) NOT NULL'
            ],
            [
                BaseSchema.TYPE_FLOAT,
                'float'
            ],
            [
                BaseSchema.TYPE_FLOAT + '(16,5)',
                'float'
            ],
            [
                BaseSchema.TYPE_FLOAT + ' CHECK (value > 5.6)',
                'float CHECK (value > 5.6)'
            ],
            [
                BaseSchema.TYPE_FLOAT + '(16,5) CHECK (value > 5.6)',
                'float CHECK (value > 5.6)'
            ],
            [
                BaseSchema.TYPE_FLOAT + ' NOT NULL',
                'float NOT NULL'
            ],
            [
                BaseSchema.TYPE_DECIMAL,
                'decimal(10,0)'
            ],
            [
                BaseSchema.TYPE_DECIMAL + '(12,4)',
                'decimal(12,4)'
            ],
            [
                BaseSchema.TYPE_DECIMAL + ' CHECK (value > 5.6)',
                'decimal(10,0) CHECK (value > 5.6)'
            ],
            [
                BaseSchema.TYPE_DECIMAL + '(12,4) CHECK (value > 5.6)',
                'decimal(12,4) CHECK (value > 5.6)'
            ],
            [
                BaseSchema.TYPE_DECIMAL + ' NOT NULL',
                'decimal(10,0) NOT NULL'
            ],
            [
                BaseSchema.TYPE_DATETIME,
                'datetime'
            ],
            [
                BaseSchema.TYPE_DATETIME + ' CHECK(value BETWEEN \'2011-01-01\' AND \'2013-01-01\')',
                'datetime CHECK(value BETWEEN \'2011-01-01\' AND \'2013-01-01\')'
            ],
            [
                BaseSchema.TYPE_DATETIME + ' NOT NULL',
                'datetime NOT NULL'
            ],
            [
                BaseSchema.TYPE_TIMESTAMP,
                'timestamp'
            ],
            [
                BaseSchema.TYPE_TIMESTAMP + ' CHECK(value BETWEEN \'2011-01-01\' AND \'2013-01-01\')',
                'timestamp CHECK(value BETWEEN \'2011-01-01\' AND \'2013-01-01\')'
            ],
            [
                BaseSchema.TYPE_TIMESTAMP + ' NOT NULL',
                'timestamp NOT NULL'
            ],
            [
                BaseSchema.TYPE_TIME,
                'time'
            ],
            [
                BaseSchema.TYPE_TIME + ' CHECK(value BETWEEN \'12:00:00\' AND \'13:01:01\')',
                'time CHECK(value BETWEEN \'12:00:00\' AND \'13:01:01\')'
            ],
            [
                BaseSchema.TYPE_TIME + ' NOT NULL',
                'time NOT NULL'
            ],
            [
                BaseSchema.TYPE_DATE,
                'date'
            ],
            [
                BaseSchema.TYPE_DATE + ' CHECK(value BETWEEN \'2011-01-01\' AND \'2013-01-01\')',
                'date CHECK(value BETWEEN \'2011-01-01\' AND \'2013-01-01\')'
            ],
            [
                BaseSchema.TYPE_DATE + ' NOT NULL',
                'date NOT NULL'
            ],
            [
                BaseSchema.TYPE_BINARY,
                'blob'
            ],
            [
                BaseSchema.TYPE_BOOLEAN,
                'tinyint(1)'
            ],
            [
                BaseSchema.TYPE_BOOLEAN + ' NOT NULL DEFAULT 1',
                'tinyint(1) NOT NULL DEFAULT 1'
            ],
            [
                BaseSchema.TYPE_MONEY,
                'decimal(19,4)'
            ],
            [
                BaseSchema.TYPE_MONEY + '(16,2)',
                'decimal(16,2)'
            ],
            [
                BaseSchema.TYPE_MONEY + ' CHECK (value > 0.0)',
                'decimal(19,4) CHECK (value > 0.0)'
            ],
            [
                BaseSchema.TYPE_MONEY + '(16,2) CHECK (value > 0.0)',
                'decimal(16,2) CHECK (value > 0.0)'
            ],
            [
                BaseSchema.TYPE_MONEY + ' NOT NULL',
                'decimal(19,4) NOT NULL'
            ]
        ];
    }

    testGetColumnType(test) {
        this._getQueryBuilder().then(function(queryBuilder) {
            _each(this.columnTypes(), function(item) {
                var column = item[0];
                var expected = item[1];

                test.strictEqual(queryBuilder.getColumnType(column), expected);
            });

            test.done();
        }.bind(this));
    }

    testCreateTableColumnTypes(test) {
        var columns = {};
        var queryBuilder = null;

        this._getQueryBuilder().then(function(qb) {
            queryBuilder = qb;
            return queryBuilder.db.getSchema().loadTableSchema('column_type_table', true);
        }).then(function(table) {
            if (table !== null) {
                // Clear
                return this.getConnection(false).then(function(db) {
                    return queryBuilder.dropTable('column_type_table').then(function(sql) {
                        return db.createCommand(sql).execute();
                    });
                });
            }
        }.bind(this)).then(function() {
            var i = 1;
            _each(this.columnTypes(), function(item) {
                var column = item[0];

                if (column.substr(0, 2) !== 'pk') {
                    columns['col' + i++] = column.replace('CHECK (value', 'CHECK (col' + i);
                }
            });

            // Create new
            return this.getConnection(false).then(function(db) {
                return queryBuilder.createTable('column_type_table', columns).then(function(sql) {
                    return db.createCommand(sql).execute();
                });
            });
        }.bind(this)).then(function() {

            // Check created
            return queryBuilder.db.getSchema().loadTableSchema('column_type_table', true);
        }.bind(this)).then(function(table) {
            test.notStrictEqual(table, null);

            _each(table.columns, function(column, name) {
                test.strictEqual(column instanceof ColumnSchema, true);
                test.strictEqual(_has(columns, name), true);
                test.strictEqual(column.name, name);
            });

            test.done();
        });
    }

    testBuildCondition(test) {
        var conditions = [
            // empty values
            [
                [
                    'like',
                    'name',
                    []
                ],
                '0=1',
                []
            ],
            [
                [
                    'not like',
                    'name',
                    []
                ],
                '',
                []
            ],
            [
                [
                    'or like',
                    'name',
                    []
                ],
                '0=1',
                []
            ],
            [
                [
                    'or not like',
                    'name',
                    []
                ],
                '',
                []
            ],

            // simple like
            [
                [
                    'like',
                    'name',
                    'heyho'
                ],
                '`name` LIKE :qp0',
                {
                    ':qp0': '%heyho%'
                }
            ],
            [
                [
                    'not like',
                    'name',
                    'heyho'
                ],
                '`name` NOT LIKE :qp0',
                {
                    ':qp0': '%heyho%'
                }
            ],
            [
                [
                    'or like',
                    'name',
                    'heyho'
                ],
                '`name` LIKE :qp0',
                {
                    ':qp0': '%heyho%'
                }
            ],
            [
                [
                    'or not like',
                    'name',
                    'heyho'
                ],
                '`name` NOT LIKE :qp0',
                {
                    ':qp0': '%heyho%'
                }
            ],

            // like for many values
            [
                [
                    'like',
                    'name',
                    [
                        'heyho',
                        'abc'
                    ]
                ],
                '`name` LIKE :qp0 AND `name` LIKE :qp1',
                {
                    ':qp0': '%heyho%',
                    ':qp1': '%abc%'
                }
            ],
            [
                [
                    'not like',
                    'name',
                    [
                        'heyho',
                        'abc'
                    ]
                ],
                '`name` NOT LIKE :qp0 AND `name` NOT LIKE :qp1',
                {
                    ':qp0': '%heyho%',
                    ':qp1': '%abc%'
                }
            ],
            [
                [
                    'or like',
                    'name',
                    [
                        'heyho',
                        'abc'
                    ]
                ],
                '`name` LIKE :qp0 OR `name` LIKE :qp1',
                {
                    ':qp0': '%heyho%',
                    ':qp1': '%abc%'
                }
            ],
            [
                [
                    'or not like',
                    'name',
                    [
                        'heyho',
                        'abc'
                    ]
                ],
                '`name` NOT LIKE :qp0 OR `name` NOT LIKE :qp1',
                {
                    ':qp0': '%heyho%',
                    ':qp1': '%abc%'
                }
            ],

            // like with Expression
            [
                [
                    'like',
                    'name',
                    new Expression('CONCAT("test", colname, "%")')
                ],
                '`name` LIKE CONCAT("test", colname, "%")',
                []
            ],
            [
                [
                    'not like',
                    'name',
                    new Expression('CONCAT("test", colname, "%")')
                ],
                '`name` NOT LIKE CONCAT("test", colname, "%")',
                []
            ],
            [
                [
                    'or like',
                    'name',
                    new Expression('CONCAT("test", colname, "%")')
                ],
                '`name` LIKE CONCAT("test", colname, "%")',
                []
            ],
            [
                [
                    'or not like',
                    'name',
                    new Expression('CONCAT("test", colname, "%")')
                ],
                '`name` NOT LIKE CONCAT("test", colname, "%")',
                []
            ],
            [
                [
                    'like',
                    'name',
                    [
                        new Expression('CONCAT("test", colname, "%")'),
                        'abc'
                    ]
                ],
                '`name` LIKE CONCAT("test", colname, "%") AND `name` LIKE :qp0',
                {
                    ':qp0': '%abc%'
                }
            ],
            [
                [
                    'not like',
                    'name',
                    [
                        new Expression('CONCAT("test", colname, "%")'),
                        'abc'
                    ]
                ],
                '`name` NOT LIKE CONCAT("test", colname, "%") AND `name` NOT LIKE :qp0',
                {
                    ':qp0': '%abc%'
                }
            ],
            [
                [
                    'or like',
                    'name',
                    [
                        new Expression('CONCAT("test", colname, "%")'),
                        'abc'
                    ]
                ],
                '`name` LIKE CONCAT("test", colname, "%") OR `name` LIKE :qp0',
                {
                    ':qp0': '%abc%'
                }
            ],
            [
                [
                    'or not like',
                    'name',
                    [
                        new Expression('CONCAT("test", colname, "%")'),
                        'abc'
                    ]
                ],
                '`name` NOT LIKE CONCAT("test", colname, "%") OR `name` NOT LIKE :qp0',
                {
                    ':qp0': '%abc%'
                }
            ],

            // not
            [
                [
                    'not',
                    'name'
                ],
                'NOT (name)',
                []
            ],

            // and
            [
                [
                    'and',
                    'id=1',
                    'id=2'
                ],
                '(id=1) AND (id=2)',
                []
            ],
            [
                [
                    'and',
                    'type=1',
                    [
                        'or',
                        'id=1',
                        'id=2'
                    ]
                ],
                '(type=1) AND ((id=1) OR (id=2))',
                []
            ],

            // or
            [
                [
                    'or',
                    'id=1',
                    'id=2'
                ],
                '(id=1) OR (id=2)',
                []
            ],
            [
                [
                    'or',
                    'type=1',
                    [
                        'or',
                        'id=1',
                        'id=2'
                    ]
                ],
                '(type=1) OR ((id=1) OR (id=2))',
                []
            ],

            // between
            [
                [
                    'between',
                    'id',
                    1,
                    10
                ],
                '`id` BETWEEN :qp0 AND :qp1',
                {
                    ':qp0': 1,
                    ':qp1': 10
                }
            ],
            [
                [
                    'not between',
                    'id',
                    1,
                    10
                ],
                '`id` NOT BETWEEN :qp0 AND :qp1',
                {
                    ':qp0': 1,
                    ':qp1': 10
                }
            ],
            [
                [
                    'between',
                    'date',
                    new Expression('(NOW() - INTERVAL 1 MONTH)'),
                    new Expression('NOW()')
                ],
                '`date` BETWEEN (NOW() - INTERVAL 1 MONTH) AND NOW()',
                []
            ],
            [
                [
                    'between',
                    'date',
                    new Expression('(NOW() - INTERVAL 1 MONTH)'),
                    123
                ],
                '`date` BETWEEN (NOW() - INTERVAL 1 MONTH) AND :qp0',
                {
                    ':qp0': 123
                }
            ],
            [
                [
                    'not between',
                    'date',
                    new Expression('(NOW() - INTERVAL 1 MONTH)'),
                    new Expression('NOW()')
                ],
                '`date` NOT BETWEEN (NOW() - INTERVAL 1 MONTH) AND NOW()',
                []
            ],
            [
                [
                    'not between',
                    'date',
                    new Expression('(NOW() - INTERVAL 1 MONTH)'),
                    123
                ],
                '`date` NOT BETWEEN (NOW() - INTERVAL 1 MONTH) AND :qp0',
                {
                    ':qp0': 123
                }
            ],

            // in
            [
                [
                    'in',
                    'id',
                    [
                        1,
                        2,
                        3
                    ]
                ],
                '`id` IN (:qp0, :qp1, :qp2)',
                {
                    ':qp0': 1,
                    ':qp1': 2,
                    ':qp2': 3
                }
            ],
            [
                [
                    'not in',
                    'id',
                    [
                        1,
                        2,
                        3
                    ]
                ],
                '`id` NOT IN (:qp0, :qp1, :qp2)',
                {
                    ':qp0': 1,
                    ':qp1': 2,
                    ':qp2': 3
                }
            ],
            [
                [
                    'in',
                    'id',
                    new Query().select('id').from('users').where({
                        'active': 1
                    })
                ],
                '(`id`) IN (SELECT `id` FROM `users` WHERE `active`=:qp0)',
                {
                    ':qp0': 1
                }
            ],
            [
                [
                    'not in',
                    'id',
                    new Query().select('id').from('users').where({
                        'active': 1
                    })
                ],
                '(`id`) NOT IN (SELECT `id` FROM `users` WHERE `active`=:qp0)',
                {
                    ':qp0': 1
                }
            ],

            // composite in
            [
                [
                    'in',
                    [
                        'id',
                        'name'
                    ],
                    [
                        {
                            'id': 1,
                            'name': 'foo'
                        },
                        {
                            'id': 2,
                            'name': 'bar'
                        }
                    ]
                ],
                '(`id`, `name`) IN ((:qp0, :qp1), (:qp2, :qp3))',
                {
                    ':qp0': 1,
                    ':qp1': 'foo',
                    ':qp2': 2,
                    ':qp3': 'bar'
                }
            ],
            [
                [
                    'not in',
                    [
                        'id',
                        'name'
                    ],
                    [
                        {
                            'id': 1,
                            'name': 'foo'
                        },
                        {
                            'id': 2,
                            'name': 'bar'
                        }
                    ]
                ],
                '(`id`, `name`) NOT IN ((:qp0, :qp1), (:qp2, :qp3))',
                {
                    ':qp0': 1,
                    ':qp1': 'foo',
                    ':qp2': 2,
                    ':qp3': 'bar'
                }
            ],
            [
                [
                    'in',
                    [
                        'id',
                        'name'
                    ],
                    new Query().select([
                        'id',
                        'name'
                    ]).from('users').where({
                        'active': 1
                    })
                ],
                '(`id`, `name`) IN (SELECT `id`, `name` FROM `users` WHERE `active`=:qp0)',
                {
                    ':qp0': 1
                }
            ],
            [
                [
                    'not in',
                    [
                        'id',
                        'name'
                    ],
                    new Query().select([
                        'id',
                        'name'
                    ]).from('users').where({
                        'active': 1
                    })
                ],
                '(`id`, `name`) NOT IN (SELECT `id`, `name` FROM `users` WHERE `active`=:qp0)',
                {
                    ':qp0': 1
                }
            ],

            // exists
            [
                [
                    'exists',
                    new Query().select('id').from('users').where({
                        'active': 1
                    })
                ],
                'EXISTS (SELECT `id` FROM `users` WHERE `active`=:qp0)',
                {
                    ':qp0': 1
                }
            ],
            [
                [
                    'not exists',
                    new Query().select('id').from('users').where({
                        'active': 1
                    })
                ],
                'NOT EXISTS (SELECT `id` FROM `users` WHERE `active`=:qp0)',
                {
                    ':qp0': 1
                }
            ],

            // simple conditions
            [
                [
                    '=',
                    'a',
                    'b'
                ],
                '`a` = :qp0',
                {
                    ':qp0': 'b'
                }
            ],
            [
                [
                    '>',
                    'a',
                    1
                ],
                '`a` > :qp0',
                {
                    ':qp0': 1
                }
            ],
            [
                [
                    '>=',
                    'a',
                    'b'
                ],
                '`a` >= :qp0',
                {
                    ':qp0': 'b'
                }
            ],
            [
                [
                    '<',
                    'a',
                    2
                ],
                '`a` < :qp0',
                {
                    ':qp0': 2
                }
            ],
            [
                [
                    '<=',
                    'a',
                    'b'
                ],
                '`a` <= :qp0',
                {
                    ':qp0': 'b'
                }
            ],
            [
                [
                    '<>',
                    'a',
                    3
                ],
                '`a` <> :qp0',
                {
                    ':qp0': 3
                }
            ],
            [
                [
                    '!=',
                    'a',
                    'b'
                ],
                '`a` != :qp0',
                {
                    ':qp0': 'b'
                }
            ],
            [
                [
                    '>=',
                    'date',
                    new Expression('DATE_SUB(NOW(), INTERVAL 1 MONTH)')
                ],
                '`date` >= DATE_SUB(NOW(), INTERVAL 1 MONTH)',
                []
            ],
            [
                [
                    '>=',
                    'date',
                    new Expression('DATE_SUB(NOW(), INTERVAL :month MONTH)', {
                        ':month': 2
                    })
                ],
                '`date` >= DATE_SUB(NOW(), INTERVAL :month MONTH)',
                {
                    ':month': 2
                }
            ],

            // hash condition
            [
                {
                    'a': 1,
                    'b': 2
                },
                '(`a`=:qp0) AND (`b`=:qp1)',
                {
                    ':qp0': 1,
                    ':qp1': 2
                }
            ],
            [
                {
                    'a': new Expression('CONCAT(col1, col2)'),
                    'b': 2
                },
                '(`a`=CONCAT(col1, col2)) AND (`b`=:qp0)',
                {
                    ':qp0': 2
                }
            ]
        ];

        // adjust dbms specific escaping
        _each(conditions, function(condition, i) {
            conditions[i][1] = this._replaceQuotes(condition[1]);
        }.bind(this));

        this._getQueryBuilder().then(function(queryBuilder) {
            var testNext = function(i) {
                var item = conditions[i];
                if (!item) {
                    test.done();
                    return;
                }

                var condition = item[0];
                var expected = item[1];
                var expectedParams = item[2];

                var query = new Query().where(condition);
                queryBuilder.build(query).then(function(buildParams) {
                    var sql = buildParams[0];
                    var params = buildParams[1];

                    test.deepEqual(params, expectedParams);
                    test.equals(sql, 'SELECT *' + (_isEmpty(expected) ? '' : ' WHERE ' + expected));

                    testNext(i + 1);
                });
            };
            testNext(0);
        });
    }

    testBuildFilterCondition(test) {
        var conditions = [
            // like
            [
                [
                    'like',
                    'name',
                    []
                ],
                '',
                []
            ],
            [
                [
                    'not like',
                    'name',
                    []
                ],
                '',
                []
            ],
            [
                [
                    'or like',
                    'name',
                    []
                ],
                '',
                []
            ],
            [
                [
                    'or not like',
                    'name',
                    []
                ],
                '',
                []
            ],

            // not
            [
                [
                    'not',
                    ''
                ],
                '',
                []
            ],

            // and
            [
                [
                    'and',
                    '',
                    ''
                ],
                '',
                []
            ],
            [
                [
                    'and',
                    '',
                    'id=2'
                ],
                '(id=2)',
                []
            ],
            [
                [
                    'and',
                    'id=1',
                    ''
                ],
                '(id=1)',
                []
            ],
            [
                [
                    'and',
                    'type=1',
                    [
                        'or',
                        '',
                        'id=2'
                    ]
                ],
                '(type=1) AND ((id=2))',
                []
            ],

            // or
            [
                [
                    'or',
                    'id=1',
                    ''
                ],
                '(id=1)',
                []
            ],
            [
                [
                    'or',
                    'type=1',
                    [
                        'or',
                        '',
                        'id=2'
                    ]
                ],
                '(type=1) OR ((id=2))',
                []
            ],

            // between
            [
                [
                    'between',
                    'id',
                    1,
                    null
                ],
                '',
                []
            ],
            [
                [
                    'not between',
                    'id',
                    null,
                    10
                ],
                '',
                []
            ],

            // in
            [
                [
                    'in',
                    'id',
                    []
                ],
                '',
                []
            ],
            [
                [
                    'not in',
                    'id',
                    []
                ],
                '',
                []
            ],

            // simple conditions
            [
                [
                    '=',
                    'a',
                    ''
                ],
                '',
                []
            ],
            [
                [
                    '>',
                    'a',
                    ''
                ],
                '',
                []
            ],
            [
                [
                    '>=',
                    'a',
                    ''
                ],
                '',
                []
            ],
            [
                [
                    '<',
                    'a',
                    ''
                ],
                '',
                []
            ],
            [
                [
                    '<=',
                    'a',
                    ''
                ],
                '',
                []
            ],
            [
                [
                    '<>',
                    'a',
                    ''
                ],
                '',
                []
            ],
            [
                [
                    '!=',
                    'a',
                    ''
                ],
                '',
                []
            ]
        ];

        // adjust dbms specific escaping
        _each(conditions, function(condition, i) {
            conditions[i][1] = this._replaceQuotes(condition[1]);
        }.bind(this));

        this._getQueryBuilder().then(function(queryBuilder) {
            var testNext = function(i) {
                var item = conditions[i];
                if (!item) {
                    test.done();
                    return;
                }

                var condition = item[0];
                var expected = item[1];
                var expectedParams = item[2];

                var query = new Query().filterWhere(condition);
                queryBuilder.build(query).then(function(buildParams) {
                    var sql = buildParams[0];
                    var params = buildParams[1];

                    test.deepEqual(params, expectedParams);
                    test.equals(sql, 'SELECT *' + (_isEmpty(expected) ? '' : ' WHERE ' + expected));

                    testNext(i + 1);
                });
            };
            testNext(0);
        });
    }

    testAddDropPrimaryKey(test) {
        var tableName = 'constraints';
        var pkeyName = tableName + '_pkey';
        var queryBuilder = null;

        // ADD
        this._getQueryBuilder().then(function(qb) {
            queryBuilder = qb;
            return queryBuilder.db.createCommand().addPrimaryKey(pkeyName, tableName, ['id']);
        }).then(function() {

            return queryBuilder.db.getSchema().loadTableSchema(tableName, true);
        }).then(function(tableSchema) {
            test.equals(tableSchema.primaryKey.length, 1);

            // DROP
            return queryBuilder.db.createCommand().dropPrimaryKey(pkeyName, tableName);
        }).then(function() {

            // resets the schema
            return this._getQueryBuilder();
        }.bind(this)).then(function(qb) {
            queryBuilder = qb;

            return queryBuilder.db.getSchema().loadTableSchema(tableName);
        }).then(function(tableSchema) {
            test.equals(tableSchema.primaryKey.length, 0);
            test.done();
        });
    }

    _replaceQuotes(condition) {
        if (_indexOf([
                'mssql',
                'mysql',
                'sqlite'
            ], this.driverName) === -1) {
            condition = condition.replace(/`/g, '"');
        }
        return condition;
    }

    testBuildWhereExists(test) {
        var conditions = [
            [
                'exists',
                this._replaceQuotes('SELECT `id` FROM `TotalExample` `t` WHERE EXISTS (SELECT `1` FROM `Website` `w`)')
            ],
            [
                'not exists',
                this._replaceQuotes('SELECT `id` FROM `TotalExample` `t` WHERE NOT EXISTS (SELECT `1` FROM `Website` `w`)')
            ]
        ];

        this._getQueryBuilder().then(function(queryBuilder) {
            var testNext = function(i) {
                var item = conditions[i];
                if (!item) {
                    test.done();
                    return;
                }

                var condition = item[0];
                var expected = item[1];

                var subQuery = new Query();
                subQuery.select('1').from('Website w');

                var query = new Query();
                query.select('id').from('TotalExample t').where([
                    condition,
                    subQuery
                ]);

                queryBuilder.build(query).then(function(buildParams) {
                    var actualQuerySql = buildParams[0];
                    var actualQueryParams = buildParams[1];

                    test.equals(expected, actualQuerySql);
                    test.deepEqual({}, actualQueryParams);

                    testNext(i + 1);
                });
            };
            testNext(0);
        });
    }

    testBuildWhereExistsWithParameters(test) {
        var expectedQuerySql = this._replaceQuotes('SELECT `id` FROM `TotalExample` `t` WHERE (t.some_column = :some_value) AND (EXISTS (SELECT `1` FROM `Website` `w` WHERE (w.id = t.website_id) AND (w.merchant_id = :merchant_id)))');
        var expectedQueryParams = {
            ':some_value': 'asd',
            ':merchant_id': 6
        };

        var subQuery = new Query();
        subQuery.select('1').from('Website w').where('w.id = t.website_id').andWhere('w.merchant_id = :merchant_id', {
            ':merchant_id': 6
        });

        var query = new Query();
        query.select('id').from('TotalExample t').where([
            'exists',
            subQuery
        ]).andWhere('t.some_column = :some_value', {
            ':some_value': 'asd'
        });

        this._getQueryBuilder().then(function(queryBuilder) {

            return queryBuilder.build(query);
        }).then(function(buildParams) {
            var actualQuerySql = buildParams[0];
            var actualQueryParams = buildParams[1];

            test.equals(expectedQuerySql, actualQuerySql);
            test.deepEqual(expectedQueryParams, actualQueryParams);

            test.done();
        });
    }

    testBuildWhereExistsWithArrayParameters(test) {
        var expectedQuerySql = this._replaceQuotes('SELECT `id` FROM `TotalExample` `t` WHERE (`t`.`some_column`=:qp0) AND (EXISTS (SELECT `1` FROM `Website` `w` WHERE (w.id = t.website_id) AND ((`w`.`merchant_id`=:qp1) AND (`w`.`user_id`=:qp2))))');
        var expectedQueryParams = {
            ':qp0': 'asd',
            ':qp1': 6,
            ':qp2': 210
        };

        var subQuery = new Query();
        subQuery.select('1').from('Website w').where('w.id = t.website_id').andWhere({
            'w.merchant_id': 6,
            'w.user_id': '210'
        });

        var query = new Query();
        query.select('id').from('TotalExample t').where([
            'exists',
            subQuery
        ]).andWhere({
            't.some_column': 'asd'
        });

        this._getQueryBuilder().then(function(queryBuilder) {

            return queryBuilder.build(query);
        }).then(function(buildParams) {
            var actualQuerySql = buildParams[0];
            var actualQueryParams = buildParams[1];

            test.equals(expectedQuerySql, actualQuerySql);
            test.deepEqual(expectedQueryParams, actualQueryParams);

            test.done();
        });
    }

    /**
     * This test contains three select queries connected with UNION and UNION ALL constructions.
     * It could be useful to use "phpunit --group=db --filter testBuildUnion" command for run it.
     */
    testBuildUnion(test) {
        var expectedQuerySql = this._replaceQuotes('(SELECT `id` FROM `TotalExample` `t1` WHERE (w > 0) AND (x < 2)) UNION ( SELECT `id` FROM `TotalTotalExample` `t2` WHERE w > 5 ) UNION ALL ( SELECT `id` FROM `TotalTotalExample` `t3` WHERE w = 3 )');
        var query = new Query();
        var secondQuery = new Query();
        secondQuery.select('id').from('TotalTotalExample t2').where('w > 5');
        var thirdQuery = new Query();
        thirdQuery.select('id').from('TotalTotalExample t3').where('w = 3');
        query.select('id').from('TotalExample t1').where([
            'and',
            'w > 0',
            'x < 2'
        ]).union(secondQuery).union(thirdQuery, true);

        this._getQueryBuilder().then(function(queryBuilder) {

            return queryBuilder.build(query);
        }).then(function(buildParams) {
            var actualQuerySql = buildParams[0];
            var actualQueryParams = buildParams[1];

            test.equals(expectedQuerySql, actualQuerySql);
            test.deepEqual({}, actualQueryParams);

            test.done();
        });
    }

    testSelectSubquery(test) {
        var expected = this._replaceQuotes('SELECT *, (SELECT COUNT(*) FROM `operations` WHERE account_id = accounts.id) AS `operations_count` FROM `accounts`');

        var subquery = new Query().select('COUNT(*)').from('operations').where('account_id = accounts.id');
        var query = new Query().select('*').from('accounts').addSelect({
            operations_count: subquery
        });

        this._getQueryBuilder().then(function(queryBuilder) {

            return queryBuilder.build(query);
        }).then(function(buildParams) {
            var sql = buildParams[0];
            var params = buildParams[1];

            test.equals(expected, sql);
            test.deepEqual({}, params);

            test.done();
        });
    }

}
module.exports = new self().exports();