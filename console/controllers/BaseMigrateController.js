/**
 * @author Ihor Skliar <skliar.ihor@gmail.com>
 * @license MIT
 */

'use strict';

var Jii = require('../../BaseJii');
var Exception = require('../Exception');
var Console = require('../../helpers/Console');
var _isEmpty = require('lodash/isEmpty');
var _each = require('lodash/each');
var _keys = require('lodash/keys');
var _size = require('lodash/size');
var _template = require('lodash/template');
var _values = require('lodash/values');
var Controller = require('../Controller');
var fs = require('fs');

class BaseMigrateController extends Controller {

    preInit() {
        /**
         * @type {[]} column definition strings used for creating migration code.
         * The format of each definition is `COLUMN_NAME:COLUMN_TYPE:COLUMN_DECORATOR`.
         * For example, `--fields=name:string(12):notNull` produces a string column of size 12 which is not null.
         * @since 2.0.7
         */
        this.fields = [];

        /**
         * @type {[]} a set of template paths for generating migration code automatically.
         *
         * The key is the template type, the value is a path or the alias. Supported types are:
         * - `create_table`: table creating template
         * - `drop_table`: table dropping template
         * - `add_column`: adding new column() template
         * - `drop_column`: dropping column template
         * - `create_junction`: create junction template
         */
        this.generatorTemplateFiles = null;

        /**
         * @type {string} the template file for generating new migrations.
         * This can be either a path alias (e.g. "@app/migrations/template.js")
         * or a file path.
         */
        this.templateFile = null;

        this.migrationNamespace = 'app.migrations';

        /**
         * @type {string} the directory storing the migration classes. This can be either
         * a path alias or a directory.
         */
        this.migrationPath = '@app/migrations';

        /**
         * @type {string} the default command action.
         */
        this.defaultAction = 'up';

        super.preInit(...arguments);
    }

    /**
     * @inheritdoc
     */
    options(actionID) {
        return super.options(actionID).concat('migrationPath') // global for all actions
            .concat(actionID === 'create' ? [
                'templateFile',
                'templateFileGenerators',
                'fields'
            ] : []); // action create
    }

    /**
     * This method is invoked right before an action is to be executed (after all possible filters.)
     * It checks the existence of the [[migrationPath]].
     * @param {Jii.base.Action} action the action to be executed.
     * @returns {Promise} whether the action should continue to be executed.
     */
    beforeAction(action) {
        return super.beforeAction(action).then(success => {
            if (!success) {
                return false;
            }

            var path = Jii.getAlias(this.migrationPath);
            if (!fs.existsSync(path)) {
                if (action.id !== 'create') {
                    throw new Exception('Migration failed. Directory specified in migrationPath doesn\'t exist: ' + this.migrationPath);
                }
                fs.mkdirSync(path);
            }
            this.migrationPath = path;
            this._parseFields();

            var version = Jii.getVersion();
            this.stdout('Jii Migration Tool (based on Jii v' + version + ')\n\n');

            return true;
        });
    }

    /**
     * Upgrades the application by applying new migrations.
     * For example,
     *
     * ```
     * jii migrate     # apply all new migrations
     * jii migrate 3   # apply the first 3 new migrations
     * ```
     *
     * @param {number} limit the number of new migrations to be applied. If 0, it means
     * applying all available new migrations.
     *
     * @returns {number} the status of the action execution. 0 means normal, other values mean abnormal.
     */
    actionUp(context) {
        var limit = context.request.get(0, 0);
        return this._actionUpInternal(limit);
    }

    _actionUpInternal(limit) {
        return this._getNewMigrations().then(migrations => {
            if (migrations.length === 0) {
                this.stdout('No new migration found. Your system is up-to-date.\n', Console.FG_GREEN);

                return BaseMigrateController.EXIT_CODE_NORMAL;
            }

            var total = migrations.length;
            limit = parseInt(limit, 0);
            if (limit > 0) {
                migrations = migrations.splice(0, limit);
            }

            var n = migrations.length;
            if (n === total) {
                this.stdout('Total ' + n + ' new ' + (n === 1 ? 'migration' : 'migrations') + ' to be applied:\n', Console.FG_YELLOW);
            } else {
                this.stdout('Total ' + n + ' out of ' + total + ' new ' + (total === 1 ? 'migration' : 'migrations') + ' to be applied:\n', Console.FG_YELLOW);
            }

            _each(migrations, migration => {
                this.stdout('\t' + migration + '\n');
            });
            this.stdout('\n');

            var applied = 0;
            return this.confirm('Apply the above ' + (n === 1 ? 'migration' : 'migrations') + '?').then(bool => {
                if (!bool) {
                    return BaseMigrateController.EXIT_CODE_ERROR;
                }

                var migrateQueueFn = (migrations, i) => {
                    var migration = migrations[i];
                    if (migration) {
                        return this._migrateUp(migration).then(success => {
                            if (!success) {
                                this.stdout('\n' + applied + ' from ' + n + ' ' + (applied === 1 ? 'migration was' : 'migrations were') + ' applied.\n', Console.FG_RED);
                                this.stdout('\nMigration failed. The rest of the migrations are canceled.\n', Console.FG_RED);

                                return BaseMigrateController.EXIT_CODE_ERROR;
                            }

                            applied++;
                            return migrateQueueFn(migrations, i + 1);
                        });
                    } else {
                        this.stdout('\n' + n + ' ' + (n === 1 ? 'migration was' : 'migrations were') + ' applied.\n', Console.FG_GREEN);
                        this.stdout('\nMigrated up successfully.\n', Console.FG_GREEN);

                        return Promise.resolve();
                    }
                };
                return migrateQueueFn(migrations, 0);
            });
        });
    }

    /**
     * Downgrades the application by reverting old migrations.
     * For example,
     *
     * ```
     * jii migrate/down     # revert the last migration
     * jii migrate/down 3   # revert the last 3 migrations
     * jii migrate/down all # revert all migrations
     * ```
     *
     * @param {number} limit the number of migrations to be reverted. Defaults to 1,
     * meaning the last applied migration will be reverted.
     * @throws Exception if the number of the steps specified is less than 1.
     *
     * @returns {number} the status of the action execution. 0 means normal, other values mean abnormal.
     */
    actionDown(context) {
        var limit = context.request.get(0, 1);
        return this._actionDownInternal(limit);
    }

    _actionDownInternal(limit) {
        if (limit === 'all') {
            limit = null;
        } else {
            limit = parseInt(limit);
            if (limit < 1) {
                throw new Exception('The step argument must be greater than 0.');
            }
        }

        return this._getMigrationHistory(limit).then(migrations => {
            if (_isEmpty(migrations)) {
                this.stdout('No migration has been done before.\n', Console.FG_YELLOW);

                return BaseMigrateController.EXIT_CODE_NORMAL;
            }

            migrations = _keys(migrations);

            var n = migrations.length;
            this.stdout('Total ' + n + ' ' + (n === 1 ? 'migration' : 'migrations') + ' to be reverted:\n', Console.FG_YELLOW);
            _each(migrations, migration => {
                this.stdout('\t' + migration + '\n');
            });
            this.stdout('\n');

            var reverted = 0;
            return this.confirm('Revert the above ' + (n === 1 ? 'migration' : 'migrations') + '?').then(bool => {
                if (!bool) {
                    return BaseMigrateController.EXIT_CODE_ERROR;
                }

                var migrateQueueFn = (migrations, i) => {
                    var migration = migrations[i];
                    if (migration) {
                        return this._migrateDown(migration).then(success => {
                            if (!success) {
                                this.stdout('\n' + reverted + ' from ' + n + ' ' + (reverted === 1 ? 'migration was' : 'migrations were') + ' reverted.\n', Console.FG_RED);
                                this.stdout('\nMigration failed. The rest of the migrations are canceled.\n', Console.FG_RED);

                                return BaseMigrateController.EXIT_CODE_ERROR;
                            }

                            reverted++;
                            return migrateQueueFn(migrations, i + 1);
                        });
                    } else {
                        this.stdout('\n' + n + ' ' + (n === 1 ? 'migration was' : 'migrations were') + ' reverted.\n', Console.FG_GREEN);
                        this.stdout('\nMigrated down successfully.\n', Console.FG_GREEN);

                        return Promise.resolve();
                    }
                };
                return migrateQueueFn(migrations, 0);
            });
        });
    }

    /**
     * Redoes the last few migrations.
     *
     * This command will first revert the specified migrations, and then apply
     * them again. For example,
     *
     * ```
     * jii migrate/redo     # redo the last applied migration
     * jii migrate/redo 3   # redo the last 3 applied migrations
     * jii migrate/redo all # redo all migrations
     * ```
     *
     * @param {number} limit the number of migrations to be redone. Defaults to 1,
     * meaning the last applied migration will be redone.
     * @throws Exception if the number of the steps specified is less than 1.
     *
     * @returns {number} the status of the action execution. 0 means normal, other values mean abnormal.
     */
    actionRedo(context) {
        var limit = context.request.get(0, 1);

        if (limit === 'all') {
            limit = null;
        } else {
            limit = parseInt(limit);
            if (limit < 1) {
                throw new Exception('The step argument must be greater than 0.');
            }
        }

        return this._getMigrationHistory(limit).then(migrations => {
            if (_isEmpty(migrations)) {
                this.stdout('No migration has been done before.\n', Console.FG_YELLOW);

                return BaseMigrateController.EXIT_CODE_NORMAL;
            }

            migrations = _keys(migrations);

            var n = migrations.length;
            this.stdout('Total ' + n + ' ' + (n === 1 ? 'migration' : 'migrations') + ' to be redone:\n', Console.FG_YELLOW);
            _each(migrations, migration => {
                this.stdout('\t' + migration + '\n');
            });
            this.stdout('\n');

            return this.confirm('Redo the above ' + (n === 1 ? 'migration' : 'migrations') + '?').then(bool => {
                if (!bool) {
                    return BaseMigrateController.EXIT_CODE_ERROR;
                }

                var migrateDownQueueFn = (migrations, i) => {
                    var migration = migrations[i];
                    if (migration) {
                        return this._migrateDown(migration).then(success => {
                            if (!success) {
                                this.stdout('\nMigration failed. The rest of the migrations are canceled.\n', Console.FG_RED);
                                return BaseMigrateController.EXIT_CODE_ERROR;
                            }

                            return migrateDownQueueFn(migrations, i + 1);
                        });
                    }
                    return Promise.resolve();
                };

                return migrateDownQueueFn(migrations, 0).then(() => {
                    migrations.reverse();

                    var migrateUpQueueFn = (migrations, i) => {
                        var migration = migrations[i];
                        if (migration) {
                            return this._migrateUp(migration).then(success => {
                                if (!success) {
                                    this.stdout('\nMigration failed. The rest of the migrations migrations are canceled.\n', Console.FG_RED);

                                    return BaseMigrateController.EXIT_CODE_ERROR;
                                }

                                return migrateUpQueueFn(migrations, i + 1);
                            });
                        } else {
                            this.stdout('\n' + n + ' ' + (n === 1 ? 'migration was' : 'migrations were') + ' redone.\n', Console.FG_GREEN);
                            this.stdout('\nMigration redone successfully.\n', Console.FG_GREEN);

                            return Promise.resolve();
                        }
                    };
                    return migrateUpQueueFn(migrations, 0);
                });
            });
        });
    }

    /**
     * Upgrades or downgrades till the specified version.
     *
     * Can also downgrade versions to the certain apply time in the past by providing
     * a UNIX timestamp or a string parseable by the strtotime() function. This means
     * that all the versions applied after the specified certain time would be reverted.
     *
     * This command will first revert the specified migrations, and then apply
     * them again. For example,
     *
     * ```
     * jii migrate/to 101129_185401                      # using timestamp
     * jii migrate/to m101129_185401_create_user_table   # using full name
     * jii migrate/to 1392853618                         # using UNIX timestamp
     * jii migrate/to "2014-02-15 13:00:50"              # using strtotime() parseable string
     * ```
     *
     * @param {string} version either the version name or the certain time value in the past
     * that the application should be migrated to. This can be either the timestamp,
     * the full name of the migration, the UNIX timestamp, or the parseable datetime
     * string.
     * @throws Exception if the version argument is invalid.
     */
    actionTo(context) {
        var version = context.request.get(0);
        var matches = /^m?(\d{6}_\d{6})(_.*?)?/.exec(version);
        if (matches) {
            return this._migrateToVersion('m' + matches[1]);
        }

        if (Number(version) == version) {
            return this._migrateToTime(version);
        }

        var time = new Date(version).getTime();
        if (time) {
            return this._migrateToTime(time);
        }

        throw new Exception('The version argument must be either a timestamp (e.g. 101129_185401),\n the full name of a migration (e.g. m101129_185401_create_user_table),\n a UNIX timestamp (e.g. 1392853000), or a datetime string parseable\nby the strtotime() function (e.g. 2014-02-15 13:00:50).');
    }

    /**
     * Modifies the migration history to the specified version.
     *
     * No actual migration will be performed.
     *
     * ```
     * jii migrate/mark 101129_185401                      # using timestamp
     * jii migrate/mark m101129_185401_create_user_table   # using full name
     * ```
     *
     * @param {string} version the version at which the migration history should be marked.
     * This can be either the timestamp or the full name of the migration.
     * @returns {Promise}
     * @throws Exception if the version argument is invalid or the version cannot be found.
     */
    actionMark(context) {
        var version = context.request.get(0);
        var originalVersion = version;
        var matches = /^m?(\d{6}_\d{6})(_.*?)?/.exec(version);
        if (matches) {
            version = 'm' + matches[1];
        } else {
            throw new Exception('The version argument must be either a timestamp (e.g. 101129_185401)\nor the full name of a migration (e.g. m101129_185401_create_user_table).');
        }

        // try mark up
        return this._getNewMigrations().then(migrations => {
            for (var i = 0, l = migrations.length; i < l; i++) {
                var migration = migrations[i];
                if (migration.indexOf(version + '_') === 0) {
                    return this.confirm('Set migration history at ' + originalVersion + '?').then(bool => {
                        if (!bool) {
                            return BaseMigrateController.EXIT_CODE_NORMAL;
                        }

                        var promises = [];
                        for (var j = 0; j <= i; ++j) {
                            promises.push(this._addMigrationHistory(migrations[j]));
                        }

                        return Promise.all(promises).then(() => {
                            this.stdout('The migration history is set at ' + originalVersion + '.\nNo actual migration was performed.\n', Console.FG_GREEN);
                            return BaseMigrateController.EXIT_CODE_NORMAL;
                        });
                    });
                }
            }

            // try mark down
            return this._getMigrationHistory(null).then(migrations => {
                for (var key in migrations) {
                    if (migrations.hasOwnProperty(key)) {
                        var migration = migrations[key];
                        if (migration.indexOf(version + '_') === 0) {
                            if (i === 0) {
                                this.stdout('Already at \'' + originalVersion + '\'. Nothing needs to be done.\n', Console.FG_YELLOW);
                            } else {
                                return this.confirm('Set migration history at ' + originalVersion + '?').then(bool => {
                                    if (!bool) {
                                        return BaseMigrateController.EXIT_CODE_NORMAL;
                                    }

                                    var promises = [];
                                    for (var j = 0; j < i; ++j) {
                                        promises.push(this._removeMigrationHistory(migrations[j]));
                                    }

                                    return Promise.all(promises).then(() => {
                                        this.stdout('The migration history is set at ' + originalVersion + '.\nNo actual migration was performed.\n', Console.FG_GREEN);
                                        return BaseMigrateController.EXIT_CODE_NORMAL;
                                    });
                                });
                            }
                        }
                    }
                }
            });
        }).then(result => {
            if (result !== BaseMigrateController.EXIT_CODE_NORMAL) {
                throw new Exception('Unable to find the version \'' + originalVersion + '\'.');
            }
        });
    }

    /**
     * Displays the migration history.
     *
     * This command will show the list of migrations that have been applied
     * so far. For example,
     *
     * ```
     * jii migrate/history     # showing the last 10 migrations
     * jii migrate/history 5   # showing the last 5 migrations
     * jii migrate/history all # showing the whole history
     * ```
     *
     * @param {number} limit the maximum number of migrations to be displayed.
     * If it is "all", the whole migration history will be displayed.
     */
    actionHistory(context) {
        var limit = context.request.get(0, 10);

        if (limit === 'all') {
            limit = null;
        } else {
            limit = parseInt(limit);
            if (limit < 1) {
                throw new Exception('The limit must be greater than 0.');
            }
        }

        return this._getMigrationHistory(limit).then(migrations => {
            if (_isEmpty(migrations)) {
                this.stdout('No migration has been done before.\n', Console.FG_YELLOW);
                return BaseMigrateController.EXIT_CODE_NORMAL;
            }

            var n = _size(migrations);
            if (limit > 0) {
                this.stdout('Showing the last ' + n + ' applied ' + (n === 1 ? 'migration' : 'migrations') + ':\n', Console.FG_YELLOW);
            } else {
                this.stdout('Total ' + n + ' ' + (n === 1 ? 'migration has' : 'migrations have') + ' been applied before:\n', Console.FG_YELLOW);
            }
            _each(migrations, (time, version) => {
                this.stdout('\t(' + new Date(time * 1000).toString() + ') ' + version + '\n');
            });
        });
    }

    /**
     * Displays the un-applied new migrations.
     *
     * This command will show the new migrations that have not been applied.
     * For example,
     *
     * ```
     * jii migrate/new     # showing the first 10 new migrations
     * jii migrate/new 5   # showing the first 5 new migrations
     * jii migrate/new all # showing all new migrations
     * ```
     *
     * If it is `all`, all available new migrations will be displayed.
     * @throws Jii.console.Exception if invalid limit value passed
     */
    actionNew(context) {
        var limit = context.request.get(0, 10);

        if (limit === 'all') {
            limit = null;
        } else {
            limit = parseInt(limit);
            if (limit < 1) {
                throw new Exception('The limit must be greater than 0.');
            }
        }

        return this._getNewMigrations().then(migrations => {
            if (migrations.length === 0) {
                this.stdout('No new migrations found. Your system is up-to-date.\n', Console.FG_GREEN);
                return BaseMigrateController.EXIT_CODE_NORMAL;
            }

            var n = migrations.length;
            if (limit && n > limit) {
                migrations = migrations.slice(0, limit);
                this.stdout('Showing ' + limit + ' out of ' + n + ' new ' + (n === 1 ? 'migration' : 'migrations') + ':\n', Console.FG_YELLOW);
            } else {
                this.stdout('Found ' + n + ' new ' + (n === 1 ? 'migration' : 'migrations') + ':\n', Console.FG_YELLOW);
            }

            _each(migrations, migration => {
                this.stdout('\t' + migration + '\n');
            });
        });
    }

    /**
     * Creates a new migration.
     *
     * This command creates a new migration using the available migration template.
     * After using this command, developers should modify the created migration
     * skeleton by filling up the actual migration logic.
     *
     * ```
     * jii migrate/create create_user_table
     * ```
     *
     * @param {string} name the name of the new migration. This should only contain
     * letters, digits and/or underscores.
     * @throws Exception if the name argument is invalid.
     */
    actionCreate(context) {
        var name = context.request.get(0);
        if (!name || !name.match(/^\w+/)) {
            throw new Exception('The migration name should contain letters, digits and/or underscore characters only.');
        }

        var generateClassTime = () => {
            var t = new Date();
            return [
                t.getFullYear().toString().substr(2),
                (t.getMonth() < 10 ? '0' : '') + t.getMonth().toString(),
                (t.getDate() < 10 ? '0' : '') + t.getDate().toString(),
                '_',
                (t.getHours() < 10 ? '0' : '') + t.getHours().toString(),
                (t.getMinutes() < 10 ? '0' : '') + t.getMinutes().toString(),
                (t.getSeconds() < 10 ? '0' : '') + t.getSeconds().toString()
            ].join('');
        };

        var className = 'm' + generateClassTime() + '_' + name;
        var fullClassName = this.migrationNamespace + '.' + className;
        var file = this.migrationPath + '/' + className + '.js';

        return this.confirm('Create new migration \'' + file + '\'?').then(bool => {
            if (!bool) {
                return BaseMigrateController.EXIT_CODE_NORMAL;
            }

            var matches;
            var content = null;

            // @todo Generator templates
            /*matches = /^create_junction_(.+)_and_(.+)/.exec(name);
             if (!content && matches) {
             var firstTable = matches[1].toLowerCase();
             var secondTable = matches[2].toLowerCase();
             content = this.renderFile(Jii.getAlias(this.generatorTemplateFiles['create_junction']), {
             className: className,
             table: firstTable + '_' + secondTable,
             field_first: firstTable,
             field_second: secondTable
             });
             }

             matches = /^add_(.+)_to_(.+)/.exec(name);
             if (!content && matches) {
             content = this.renderFile(Jii.getAlias(this.generatorTemplateFiles['add_column']), {
             className: className,
             table: matches[2].toLowerCase(),
             fields: this.fields
             });
             }

             matches = /^drop_(.+)_from_(.+)/.exec(name);
             if (!content && matches) {
             content = this.renderFile(Jii.getAlias(this.generatorTemplateFiles['drop_column']), {
             className: className,
             table: matches[2].toLowerCase(),
             fields: this.fields
             });
             }

             matches = /^create_(.+)/.exec(name);
             if (!content && matches) {
             this._addDefaultPrimaryKey();
             content = this.renderFile(Jii.getAlias(this.generatorTemplateFiles['create_table']), {
             className: className,
             table: matches[1].toLowerCase(),
             fields: this.fields
             });
             }

             matches = /^drop_(.+)/.exec(name);
             if (!content && matches) {
             this.addDefaultPrimaryKey();
             content = this.renderFile(Jii.getAlias(this.generatorTemplateFiles['drop_table']), {
             className: className,
             table: matches[1].toLowerCase(),
             fields: this.fields
             });
             }*/

            if (!content) {
                // @todo renderFile
                content = _template(fs.readFileSync(Jii.getAlias(this.templateFile)).toString())({
                    className: fullClassName
                });
            }

            fs.writeFileSync(file, content);
            this.stdout('New migration created successfully.\n', Console.FG_GREEN);
        });
    }

    /**
     * Upgrades with the specified migration class.
     * @param {string} className the migration class name
     * @returns {Promise}
     */
    _migrateUp(className) {
        if (className === this.constructor.BASE_MIGRATION) {
            return Promise.resolve(true);
        }

        this.stdout('*** applying ' + className + '\n', Console.FG_YELLOW);
        var start = new Date().getTime();
        var time;

        var migration = this._createMigration(className);
        return Promise.resolve().then(() => {
            return migration.up();
        }).then(isSuccess => {
            if (isSuccess !== false) {
                return this._addMigrationHistory(className).then(() => {
                    time = new Date().getTime() - start;
                    this.stdout('*** applied ' + className + ' (time: ' + time / 1000 + 's)\n\n', Console.FG_GREEN);

                    return true;
                });
            } else {
                time = new Date().getTime() - start;
                this.stdout('*** failed to apply ' + className + ' (time: ' + time / 1000 + 's)\n\n', Console.FG_RED);

                return false;
            }
        });
    }

    /**
     * Downgrades with the specified migration class.
     * @param {string} className the migration class name
     * @returns {Promise} whether the migration is successful
     */
    _migrateDown(className) {
        if (className === this.constructor.BASE_MIGRATION) {
            return Promise.resolve(true);
        }

        this.stdout('*** reverting ' + className + '\n', Console.FG_YELLOW);
        var start = new Date().getTime();
        var time;

        var migration = this._createMigration(className);
        return Promise.resolve().then(() => {
            return migration.down();
        }).then(isSuccess => {
            if (isSuccess !== false) {
                return this._removeMigrationHistory(className).then(() => {
                    time = new Date().getTime() - start;
                    this.stdout('*** reverted ' + className + ' (time: ' + time / 1000 + 's)\n\n', Console.FG_GREEN);

                    return true;
                });
            } else {
                time = new Date().getTime() - start;
                this.stdout('*** failed to revert ' + className + ' (time: ' + time / 1000 + 's)\n\n', Console.FG_RED);

                return false;
            }
        });
    }

    /**
     * Creates a new migration instance.
     * @param {string} className the migration class name
     * @returns {object} the migration instance
     */
    _createMigration(className) {
        var file = this.migrationPath + '/' + className + '.js';
        require(file);

        var classFn = Jii.namespace(this.migrationNamespace + '.' + className);
        return new classFn();
    }

    /**
     * Migrates to the specified apply time in the past.
     * @param {number} time
     */
    _migrateToTime(time) {
        var count = 0;

        return this._getMigrationHistory(null).then(migrations => {
            migrations = _values(migrations);

            while (count < migrations.length && migrations[count] > time) {
                ++count;
            }

            if (count === 0) {
                this.stdout('Nothing needs to be done.\n', Console.FG_GREEN);
            } else {
                return this._actionDownInternal(count);
            }
        });
    }

    /**
     * Migrates to the certain version.
     * @param {string} version name in the full format.
     * @returns {number} CLI exit code
     * @throws Exception if the provided version cannot be found.
     */
    _migrateToVersion(version) {
        var originalVersion = version;

        // try migrate up
        return this._getNewMigrations().then(migrations => {
            for (var i = 0, l = migrations.length; i < l; i++) {
                var migration = migrations[i];
                if (migration.indexOf(version + '_') === 0) {
                    return this._actionUpInternal(i + 1);
                }
            }

            // try migrate down
            return this._getMigrationHistory(null).then(migrations => {
                migrations = _keys(migrations);

                for (var i = 0, l = migrations.length; i < l; i++) {
                    var migration = migrations[i];
                    if (migration.indexOf(version + '_') === 0) {
                        if (i === 0) {
                            this.stdout('Already at \'' + originalVersion + '\'. Nothing needs to be done.\n', Console.FG_YELLOW);
                        } else {
                            return this._actionDownInternal(i);
                        }

                        return BaseMigrateController.EXIT_CODE_NORMAL;
                    }
                }

                throw new Exception('Unable to find the version \'originalVersion\'.');
            });
        });
    }

    /**
     * Returns the migrations that are not applied.
     * @returns {Promise} list of new migrations
     */
    _getNewMigrations() {
        return this._getMigrationHistory(null).then(migrations => {
            var applied = {};
            _each(migrations, (time, version) => {
                applied[version.substr(1, 13)] = true;
            });

            var names = [];
            var files = fs.readdirSync(this.migrationPath);

            _each(files, file => {
                if (file.substr(0, 1) === '.') {
                    return;
                }

                var matches = /^(m(\d{6}_\d{6})_.*?)\.js/.exec(file);
                if (matches && !applied[matches[2]]) {
                    names.push(matches[1]);
                }
            });

            names.sort();

            return names;
        });
    }

    /**
     * Parse the command line migration fields
     * @since 2.0.7
     */
    _parseFields() {
        _each(this.fields, (field, index) => {
            var chunks = field.split(/\s?:\s?/);
            var property = chunks.shift();

            _each(chunks, (chunk, i) => {
                if (!chunk.match(/^(.+?)\(([^)]+)\)/)) {
                    chunks[i] += '()';
                }
            });
            this.fields[index] = {
                property: property,
                decorators: chunks.join('.')
            };
        });
    }

    /**
     * Adds default primary key to fields list if there's no primary key specified
     * @since 2.0.7
     */
    _addDefaultPrimaryKey() {
        var isFined = false;
        _each(this.fields, field => {
            if (field['decorators'] === 'primaryKey()') {
                isFined = true;
            }
        });

        if (!isFined) {
            this.fields.unshift({
                property: 'id',
                decorators: 'primaryKey()'
            });
        }
    }

    /**
     * Returns the migration history.
     * @param {number} limit the maximum number of records in the history to be returned. `null` for "no limit".
     * @returns {[]} the migration history
     */
    _getMigrationHistory(limit) {
        return new Promise();
    }

    /**
     * Adds new migration entry to the history.
     * @param {string} version migration version name.
     */
    _addMigrationHistory(version) {
        return new Promise();
    }

    /**
     * Removes existing migration from the history.
     * @param {string} version migration version name.
     */
    _removeMigrationHistory(version) {
        return new Promise();
    }

}

/**
 * The name of the dummy migration that marks the beginning of the whole migration history.
 */
BaseMigrateController.BASE_MIGRATION = 'm000000_000000_base';
module.exports = BaseMigrateController;