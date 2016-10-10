/**
 * @author Ihor Skliar <skliar.ihor@gmail.com>
 * @license MIT
 */

'use strict';

var Jii = require('jii');
var Console = require('../../helpers/Console');
var ConsoleApplication = require('../../application/ConsoleApplication');
var Application = require('jii/base/Application');
var Exception = require('../Exception');
var _trim = require('lodash/trim');
var _isFunction = require('lodash/isFunction');
var _isEmpty = require('lodash/isEmpty');
var _isArray = require('lodash/isArray');
var _isBoolean = require('lodash/isBoolean');
var _isString = require('lodash/isString');
var _uniq = require('lodash/uniq');
var _each = require('lodash/each');
var _repeat = require('lodash/repeat');
var _endsWith = require('lodash/endsWith');
var Controller = require('../Controller');
var fs = require('fs');

/**
 * Provides help information about console commands.
 *
 * This command displays the available command list in
 * the application or the detailed instructions about using
 * a specific command.
 *
 * This command can be used as follows on command line:
 *
 * ~~~
 * jii help [command name]
 * ~~~
 *
 * In the above, if the command name is not provided, all
 * available commands will be displayed.
 *
 * @property array commands All available command names. This property is read-only.
 * @class Jii.console.controllers.HelpController
 * @extends Jii.console.Controller
 */
var HelpController = Jii.defineClass('Jii.console.controllers.HelpController', /** @lends Jii.console.controllers.HelpController.prototype */{

    __extends: Controller,

    /**
     * Displays available commands or the detailed information
     * about a particular command.
     *
     * @param {string} context
     * @returns {number} the exit status
     * @throws {Jii.console.Exception} if the command for help is unknown
     */
    actionIndex(context) {
        var params = context.request.getParams();
        var command = params[0];

        if (command) {
            var result = Jii.app.createController(command);
            if (!result) {
                throw new Exception(Jii.t('jii', 'No help for unknown command "{name}".', {name: command}));
            }

            var controller = result[0];
            var actionID = result[1];

            var actions = this.getActions(controller);
            if (actionID !== '' || actions.length === 1 && actions[0] === controller.defaultAction) {
                this._getSubCommandHelp(controller, actionID);
            } else {
                this._getCommandHelp(controller);
            }
        } else {
            this._getDefaultHelp();
        }
    },

    /**
     * Returns all available command names.
     * @returns {[]} all available command names
     */
    getCommands() {
        var commands = this._getModuleCommands(Jii.app);
        commands = commands.sort();
        return _uniq(commands);
    },

    /**
     * Returns an array of commands an their descriptions.
     * @returns {object} all available commands as keys and their description as values.
     */
    _getCommandDescriptions() {
        var descriptions = {};
        _each(this.getCommands(), command => {
            var result = Jii.app.createController(command);
            descriptions[command] = result ? result[0].getHelpSummary() : '';
        });

        return descriptions;
    },

    /**
     * Returns all available actions of the specified controller.
     * @param {Jii.console.Controller} controller the controller instance
     * @returns {[]} all available action IDs.
     */
    getActions(className) {
        var actions = Object.keys(className.actions());
        var exp = /^action/;

        _each(Object.getOwnPropertyNames(className), name => {
            if (_isFunction(className[name]) && name !== 'actions' && exp.test(name)) {
                actions.push(name.replace(exp, '').toLowerCase());
            }
        });
        actions.sort();

        return _uniq(actions);
    },

    /**
     * Returns available commands of a specified module.
     * @param {Jii.base.Module} module the module instance
     * @returns {[]} the available command names
     */
    _getModuleCommands(module) {
        var prefix = module instanceof Application ? '' : module.getUniqueID() + '/';

        var commands = [];
        _each(Object.keys(module.controllerMap), id => {
            if (_endsWith(id, 'Controller')) {
                id = id.charAt(0).toLowerCase() + id.slice(1, -10).replace(/([A-Z])/g, (m, v) => '-' + v.toLowerCase());
            }
            commands.push(prefix + id);
        });

        _each(module.getModules(), (child, id) => {
            if ((child = module.getModule(id)) === null) {
                return;
            }

            _each(this._getModuleCommands(child), command => {
                commands.push(command);
            });
        });

        var controllerPath = module.getControllerPath();
        if (fs.existsSync(controllerPath) && fs.lstatSync(controllerPath).isDirectory()) {
            var files = fs.readdirSync(controllerPath);
            _each(files, file => {
                if (!_isEmpty(file) && file.indexOf('Controller.js') !== -1) {
                    var controllerClass = module.controllerNamespace + '.' + file.substr(0, -4);
                    if (this._validateControllerClass(controllerClass)) {
                        //commands.push(prefix + Inflector.camel2id(file.substr(0, -14))); // @todo
                    }
                }
            });
        }

        return commands;
    },

    /**
     * Validates if the given class is a valid console controller class.
     * @param {string} controllerClass
     * @returns {boolean}
     */
    _validateControllerClass(className) {
        if (className !== undefined) {
            return className.__parentClassName === 'Jii.console.Controller'; // @todo
        } else {
            return false;
        }
    },

    /**
     * Displays the overall information of the command.
     * @param {Jii.console.Controller} controller the controller instance
     */
    _getCommandHelp(controller) {
        controller.color = this.color;

        this.stdout("\nDESCRIPTION\n", Console.BOLD);

        var comment = controller.getHelp();
        if (comment !== '') {
            this.stdout("\n"+comment+"\n\n");
        }

        var actions = this.getActions(controller);
        if (!_isEmpty(actions)) {
            this.stdout("\nSUB-COMMANDS\n\n", Console.BOLD);

            var prefix = controller.getUniqueId();

            var maxlen = 5;
            _each(actions, action => {
                var len = (prefix + '/' + action).length + 2 + (action === controller.defaultAction ? 10 : 0);
                if (maxlen < len) {
                    maxlen = len;
                }
            });

            _each(actions, action => {
                this.stdout('- ' + prefix + '/' + action, Console.BOLD);

                var len = (prefix + '/' + action).length + 2;
                if (action === controller.defaultAction) {
                    this.stdout(' (default)', Console.FG_GREEN);
                    len += 10;
                }
                var summary = controller.getActionHelpSummary(controller.createAction(action));

                if (summary !== '') {
                    this.stdout(new Array( maxlen - len + 2 ).join( ' ' ) + summary);
                }

                this.stdout("\n");
            });
            var scriptName = this._getScriptName();
            this.stdout("\nTo see the detailed information about individual sub-commands, enter:\n");
            this.stdout('\n  ' + scriptName + ' ' + this.ansiFormat('help', Console.FG_YELLOW) + ' '
                + this.ansiFormat('<command-name>', Console.FG_CYAN) + '\n\n');
        }
    },

    /**
     * Displays the detailed information of a command action.
     * @param {Jii.console.Controller} controller the controller instance
     * @param {string} actionID action ID
     * @throws Exception if the action does not exist
     */
    _getSubCommandHelp(controller, actionID) {
        var action = controller.createAction(actionID);
        if (action === null) {
            var name = controller.getUniqueId() + '/' + actionID;
            throw new Exception(Jii.t('jii', 'No help for unknown sub-command "{name}".', {name: name}));
        }

        var description = controller.getActionHelp(action);
        if (description !== '') {
            this.stdout("\nDESCRIPTION\n", Console.BOLD);
            this.stdout("\n" + description + "\n\n");
        }

        this.stdout("\nUSAGE\n\n", Console.BOLD);

        var scriptName = this._getScriptName();
        if (action.id === controller.defaultAction) {
            this.stdout(scriptName + ' ' + this.ansiFormat(controller.getUniqueId(), Console.FG_YELLOW));
        } else {
            this.stdout(scriptName + ' ' + this.ansiFormat(action.getUniqueId(), Console.FG_YELLOW));
        }

        var args = controller.getActionArgsHelp(action);
        _each(args, (arg, name) => {
            if (arg['required']) {
                this.stdout(' <' + name + '>', Console.FG_CYAN);
            } else {
                this.stdout(' [' + name + ']', Console.FG_CYAN);
            }
        });

        var options = controller.getActionOptionsHelp(action);
        options[ConsoleApplication.OPTION_APPCONFIG] = {
            type: 'string',
            default: null,
            comment: "custom application configuration file path.\nIf not set, default application configuration is used."
        };

        if (!_isEmpty(options)) {
            this.stdout(' [...options...]', Console.FG_RED);
        }
        this.stdout("\n\n");

        if (!_isEmpty(args)) {
            _each(args, (arg, name) => {
                this.stdout(this._formatOptionHelp(
                        '- ' + this.ansiFormat(arg['required'] ? name + " (required)" : name, Console.FG_CYAN),
                        arg['required'],
                        arg['type'],
                        arg['default'],
                        arg['comment']));

                this.stdout("\n\n");
            });
        }

        if (!_isEmpty(options)) {
            this.stdout("\nOPTIONS\n\n", Console.BOLD);
            _each(options, (option, name) => {
                this.stdout(this._formatOptionHelp(
                        this.ansiFormat('--' + name, Console.FG_RED, !options.required ? Console.FG_RED : Console.BOLD),
                        option['required'],
                        option['type'],
                        option['default'],
                        option['comment']));

                this.stdout("\n\n");
            });
        }
    },

    /**
     * Generates a well-formed string for an argument or option.
     * @param {string} name the name of the argument or option
     * @param {boolean} required whether the argument is required
     * @param {string} type the type of the option or argument
     * @param {*} defaultValue the default value of the option or argument
     * @param {string} comment comment about the option or argument
     * @returns {string} the formatted string for the argument or option
     */
    _formatOptionHelp(name, required, type, defaultValue, comment) {
        comment = _trim(comment);
        type = type ? _trim(type) : null;

        if (type && (type.substring(0, 4) === 'bool'.substring(0, 4)) === 0) {
            type = 'boolean, 0 or 1';
        }

        var doc;
        if (defaultValue !== null && !_isArray(defaultValue)) {
            if (type === null) {
                type = typeof defaultValue;
            }
            if (_isBoolean(defaultValue)) {
                // show as integer to avoid confusion
                defaultValue = defaultValue ? 1 : 0;
            }
            if (_isString(defaultValue)) {
                defaultValue = "'" + defaultValue + "'";
            } else {
                defaultValue = JSON.stringify(defaultValue);
            }
            doc = type + ' (defaults to ' + defaultValue + ')';
        } else {
            doc = type;
        }

        if (doc === '') {
            doc = comment;
        } else if (comment !== '') {
            doc += "\n" + comment.replace(/^/, "  ").replace(/\n/, "\n  ");
        }

        name = required ? name + ' (required)' : name;

        return doc === '' ? name : name + ': ' + doc;
    },

    _getDefaultHelp() {
        this.stdout('\nThis is Jii version ' + Jii.getVersion() + '.\n');

        var commands = this._getCommandDescriptions();
        if (!_isEmpty(commands)) {
            this.stdout('\nThe following commands are available:\n\n', Console.BOLD);

            var len = 0;
            _each(commands, (description, command) => {
                var result = Jii.app.createController(command);
                if (result !== null) {
                    var controller = result[0];

                    var actions = this.getActions(controller);
                    if (actions.length > 0) {

                        var prefix = controller.getUniqueId();
                        _each(actions, action => {
                            var string = prefix + '/' + action;
                            if (action === controller.defaultAction) {
                                string += ' (default)';
                            }

                            var l = string.length;
                            if (l > len) {
                                len = l;
                            }
                        });
                    }
                } else {
                    var l = command.length;
                    if (l > len) {
                        len = l;
                    }
                }
            });

            _each(commands, (description, command) => {
                this.stdout('- ' + this.ansiFormat(command, Console.FG_YELLOW));
                this.stdout(_repeat(' ', len + 4 - command.length));
                this.stdout(Console.wrapText(description, len + 4 + 2), Console.BOLD);
                this.stdout('\n');

                var result = Jii.app.createController(command.name);
                if (result !== null) {
                    var controller = result[0];

                    var actions = this.getActions(controller);
                    if (actions.length > 0) {

                        var prefix = controller.getUniqueId();
                        _each(actions, action => {
                            var string = '  ' + prefix + '/' + action;
                            this.stdout('  ' + this.ansiFormat(string, Console.FG_GREEN));

                            if (action === controller.defaultAction) {
                                string += ' (default)';
                                this.stdout(' (default)', Console.FG_YELLOW);
                            }
                            var summary = controller.getActionHelpSummary(controller.createAction(action));
                            if (summary !== '') {
                                this.stdout(_repeat(' ', len + 4 - string.length));
                                this.stdout(Console.wrapText(summary, len + 4 + 2));
                            }
                            this.stdout('\n');
                        });
                    }
                    this.stdout('\n');
                }
            });

            var scriptName = this._getScriptName();
            this.stdout('\nTo see the help of each command, enter:\n', Console.BOLD);
            this.stdout('\n  ' + scriptName + ' ' + this.ansiFormat('help', Console.FG_YELLOW) + ' '
                + this.ansiFormat('<command-name>', Console.FG_CYAN) + '\n\n');

        } else {
            this.stdout('\nNo commands are found.\n\n', Console.BOLD);
        }
    },

    /**
     * @returns {string} the name of the cli script currently running.
     */
    _getScriptName() {
        var matches = /[^\/]+$/.exec(process.argv[1]);
        return matches !== null ? matches[0] : 'jii';
    }

});

module.exports = HelpController;