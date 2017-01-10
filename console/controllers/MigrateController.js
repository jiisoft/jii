/**
 * @author Ihor Skliar <skliar.ihor@gmail.com>
 * @license MIT
 */

'use strict';

const Jii = require('../../BaseJii');
const Component = require('../../base/Component');
const Console = require('../../helpers/Console');
const Query = require('../../data/Query');
const _each = require('lodash/each');
const BaseMigrateController = require('./BaseMigrateController');
const fs = require('fs');

class MigrateController extends BaseMigrateController {

    preInit() {
        /**
         * @type {BaseConnection|string} the DB connection object or the application component ID of the DB connection to use
         * when applying migrations. Starting from version 2.0.3, this can also be a configuration array
         * for creating the object.
         */
        this.db = null;

        /**
         * @inheritdoc
         */
        this.templateFile = __dirname + '/../views/migration.js';

        /**
         * @type {string} the name of the table for keeping applied migration information.
         */
        this.migrationTable = '{{%migration}}';

        super.preInit(...arguments);
    }

    /**
     * @inheritdoc
     */
    options(actionID) {
        return super.options(actionID).concat([
            'migrationTable',
            'db'
        ]); // global for all actions
    }

    /**
     * This method is invoked right before an action is to be executed (after all possible filters.)
     * It checks the existence of the [[migrationPath]].
     * @param {Action} action the action to be executed.
     * @returns {boolean} whether the action should continue to be executed.
     */
    beforeAction(action) {
        return super.beforeAction(action).then(success => {
            if (success && action.id !== 'create') {
                this.db = this.db === null ? Jii.app.get('db') : this.db instanceof Component ? this.db : Jii.createObject(this.db);
            }

            return success;
        });
    }

    /**
     * Creates a new migration() instance.
     * @param {string} className the migration class name
     * @returns {\jii\db\Migration} the migration instance
     */
    _createMigration(className) {
        var file = this.migrationPath + '/' + className + '.js';
        require(file);

        var classFn = Jii.namespace(this.migrationNamespace + '.' + className);
        return new classFn({
            db: this.db
        });
    }

    /**
     * @inheritdoc
     */
    _getMigrationHistory(limit) {
        return Promise.resolve().then(() => {
            if (this.db.getSchema().getTableSchema(this.migrationTable, true) === null) {
                return this._createMigrationHistoryTable();
            }
        }).then(() => {
            return new Query().select([
                'version',
                'apply_time'
            ]).from(this.migrationTable).orderBy('apply_time DESC, version DESC').limit(limit).all(this.db).then(rows => {
                var history = {};
                _each(rows, row => {
                    history[row.version] = row.apply_time;
                });
                delete history[this.constructor.BASE_MIGRATION];

                return history;
            });
        });
    }

    /**
     * Creates the migration history table.
     */
    _createMigrationHistoryTable() {
        var tableName = this.db.getSchema().getRawTableName(this.migrationTable);
        this.stdout('Creating migration history table "' + tableName + '"...', Console.FG_YELLOW);

        return this.db.createCommand().createTable(this.migrationTable, {
            version: 'varchar(180) NOT NULL PRIMARY KEY',
            apply_time: 'integer'
        }).then(() => {
            return this.db.createCommand().insert(this.migrationTable, {
                version: this.constructor.BASE_MIGRATION,
                apply_time: Math.round(new Date().getTime() / 1000)
            });
        }).then(() => {
            this.stdout('Done.\n', Console.FG_GREEN);
        });
    }

    /**
     * @inheritdoc
     */
    _addMigrationHistory(version) {
        return this.db.createCommand().insert(this.migrationTable, {
            version: version,
            apply_time: Math.round(new Date().getTime() / 1000)
        });
    }

    /**
     * @inheritdoc
     */
    _removeMigrationHistory(version) {
        return this.db.createCommand().delete(this.migrationTable, {
            version: version
        });
    }

}
module.exports = MigrateController;