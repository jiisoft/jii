module.exports = {

	/*cubrid: {
		dsn: 'cubrid:dbname=demodb;host=localhost;port=33000',
		username: 'dba',
		password: '',
		fixture: __dirname + '/fixture/cubrid.sql'
	},*/
	mysql: {
		className: require('jii-mysql'),
		database: 'jiitest',
		username: 'jiitest',
		password: 'jiitest',
		fixture: __dirname + '/fixture/mysql.sql'
	}/*,
	sqlite: {
		dsn: 'sqlite.memory:',
		fixture: __dirname + '/fixture/sqlite.sql'
	},
	sqlsrv: {
		dsn: 'sqlsrv:Server=localhost;Database=test',
		username: '',
		password: '',
		fixture: __dirname + '/fixture/mssql.sql'
	},
	pgsql: {
		dsn: 'pgsql:host=localhost;dbname=jiitest;port=5432;',
		username: 'postgres',
		password: 'postgres',
		fixture: __dirname + '/fixture/postgres.sql'
	},
	elasticsearch: {
		dsn: 'elasticsearch://localhost:9200'
	},
	redis: {
		hostname: 'localhost',
		port: 6379,
		database: 0,
		password: null
	}*/
};