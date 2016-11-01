/**
 * @author Ihor Skliar <skliar.ihor@gmail.com>
 * @license MIT
 */

'use strict';

var Jii = require('../../BaseJii');
var Component = require('../../base/Component');
var Console = require('../../helpers/Console');
var Query = require('../../data/Query');
var _each = require('lodash/each');
var BaseMigrateController = require('./BaseMigrateController');
var fs = require('fs');

/**
 * Manages application migrations.
 *
 * A migration means a set of persistent changes to the application environment
 * that is shared among different developers. For example, in an application
 * backed by a database, a migration may refer to a set of changes to
 * the database, such as creating a new table(), adding a new table() column.
 *
 * This command provides support for tracking the migration history, upgrading
 * or downloading with migrations, and creating new migration() skeletons.
 *
 * The migration history is stored in a database table named
 * as [[migrationTable]]. The table will be automatically created the first time
 * this command is executed, if it does not exist. You may also manually
 * create it as follows:
 *
 * ```sql
 * CREATE TABLE migration (
 *     version varchar(180) PRIMARY KEY,
 *     apply_time integer
 * )
 * ```
 *
 * Below are some common usages of this command:
 *
 * ```
 * # creates a new migration() named 'create_user_table'
 * jii migrate/create create_user_table
 *
 * # applies ALL new migrations()
 * jii migrate
 *
 * # reverts the last applied migration
 * jii migrate/down
 * ```
 *
 * @class Jii.console.controllers.MigrateController
 * @extends Jii.console.controllers.BaseMigrateController
 */
var MigrateController = Jii.defineClass('Jii.console.controllers.MigrateController', /** @lends Jii.console.controllers.MigrateController.prototype */{

    __extends: BaseMigrateController,

    /**
     * @type {string} the name of the table for keeping applied migration information.
     */
    migrationTable: '{{%migration}}',

    /**
     * @inheritdoc
     */
    templateFile: __dirname + '/../views/migration.js',

    /**
     * @type {Jii.data.BaseConnection|string} the DB connection object or the application component ID of the DB connection to use
     * when applying migrations. Starting from version 2.0.3, this can also be a configuration array
     * for creating the object.
     */
    db: null,

    /**
     * @inheritdoc
     */
    options(actionID) {
        return this.__super(actionID).concat(['migrationTable', 'db']); // global for all actions
    },

    /**
     * This method is invoked right before an action is to be executed (after all possible filters.)
     * It checks the existence of the [[migrationPath]].
     * @param {Jii.base.Action} action the action to be executed.
     * @returns {boolean} whether the action should continue to be executed.
     */
    beforeAction(action) {
        return this.__super(action).then(success => {
            if (success && action.id !== 'create') {
                this.db = this.db === null ?
                    Jii.app.get('db') :
                    (
                        this.db instanceof Component ?
                            this.db :
                            Jii.createObject(this.db)
                    );
            }

            return success;
        });
    },

    /**
     * Creates a new migration() instance.
     * @param {string} className the migration class name
     * @returns {\jii\db\Migration} the migration instance
     */
    _createMigration(className) {
        var file = this.migrationPath + '/' + className + '.js';
        require(file);

        var classFn = Jii.namespace(this.migrationNamespace + '.' + className);
        return new classFn({db: this.db});
    },

    /**
     * @inheritdoc
     */
    _getMigrationHistory(limit) {
        return Promise.resolve().then(() => {
            if (this.db.getSchema().getTableSchema(this.migrationTable, true) === null) {
                return this._createMigrationHistoryTable();
            }
        }).then(() => {
            return (new Query()).select(['version', 'apply_time'])
                .from(this.migrationTable)
                .orderBy('apply_time DESC, version DESC')
                .limit(limit)
                .all(this.db)
                .then(rows => {
                    var history = {};
                    _each(rows, row => {
                        history[row.version] = row.apply_time;
                    });
                    delete history[this.__static.BASE_MIGRATION];

                    return history;
                });
        });
    },

    /**
     * Creates the migration history table.
     */
    _createMigrationHistoryTable() {
        var tableName = this.db.getSchema().getRawTableName(this.migrationTable);
        this.stdout('Creating migration history table "' + tableName + '"...', Console.FG_YELLOW);

        return this.db.createCommand()
            .createTable(this.migrationTable, {
                version: 'varchar(180) NOT NULL PRIMARY KEY',
                apply_time: 'integer'
            })
            .then(() => {
                return this.db.createCommand()
                    .insert(this.migrationTable, {
                        version: this.__static.BASE_MIGRATION,
                        apply_time: Math.round((new Date()).getTime() / 1000)
                    });
            }).then(() => {
                this.stdout("Done.\n", Console.FG_GREEN);
            });
    },

    /**
     * @inheritdoc
     */
    _addMigrationHistory(version) {
        return this.db.createCommand().insert(this.migrationTable, {
            version: version,
            apply_time: Math.round((new Date()).getTime() / 1000)
        });
    },

    /**
     * @inheritdoc
     */
    _removeMigrationHistory(version) {
        return this.db.createCommand().delete(this.migrationTable, {
            version: version
        });
    }

});

module.exports = MigrateController;