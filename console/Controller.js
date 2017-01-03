/**
 * @author Ihor Skliar <skliar.ihor@gmail.com>
 * @license MIT
 */

'use strict';

var Jii = require('../index');
var Console = require('../helpers/Console');
var Exception = require('./Exception');
var _trim = require('lodash/trim');
var _isEmpty = require('lodash/isEmpty');
var _indexOf = require('lodash/indexOf');
var _isArray = require('lodash/isArray');
var _toArray = require('lodash/toArray');
var _isFunction = require('lodash/isFunction');
var _isUndefined = require('lodash/isUndefined');
var _each = require('lodash/each');
var _values = require('lodash/values');
var _compact = require('lodash/compact');
var BaseController = require('../base/Controller');
var fs = require('fs');
var extract = require('extract-comments');

class Controller extends BaseController {

    preInit() {
        /**
         * @type {string[]} the options passed during execution.
         */
        this._passedOptions = [];

        /**
         * @type {{main: {help: string, description: string}, properties: object, actions: object}}
         */
        this._comments = null;

        /**
         * If not set, ANSI color will only be enabled for terminals that support it.
         * @type {boolean} whether to enable ANSI color in the output.
         */
        this.color = true;

        /**
         * @type {boolean} whether to run the command interactively.
         */
        this.interactive = true;

        super.preInit(...arguments);
    }

    /**
     * Returns a value indicating whether ANSI color is enabled.
     *
     * ANSI color is enabled only if [[color]] is set true or is not set
     * and the terminal supports ANSI color.
     *
     * @returns {boolean} Whether to enable ANSI style in output.
     */
    isColorEnabled() {
        return this.color;
    }

    /**
     * Runs an action with the specified action ID and parameters.
     * If the action ID is empty, the method will use [[defaultAction]].
     * @param {string} id the ID of the action to be executed.
     * @param {Jii.base.Context} context
     * @returns {Promise} the status of the action execution. 0 means normal, other values mean abnormal.
     */
    runAction(id, context) {

        var params = context.request.getParams();
        if (!_isEmpty(params)) {
            // populate options here so that they are available in beforeAction().
            var options = this.options(id === '' ? this.defaultAction : id);
            _each(params, (value, name) => {
                if (_indexOf(options, name) !== -1) {
                    var defaultAction = this.name;
                    this.name = _isArray(defaultAction) ? value.split(/\s*,\s*/) : value;
                    delete params[name];
                } else if (Number(name) != name) {
                    throw new Exception(Jii.t('jii', 'Unknown option: --{name}', {
                        name: name
                    }));
                }
                this._passedOptions.push(name);
            });
        }

        return super.runAction(id, context);
    }

    /**
     * Formats a string with ANSI codes
     *
     * You may pass additional parameters using the constants defined in [[Jii.helpers.Console]].
     *
     * Example:
     *
     * ```
     * echo this.ansiFormat('This will be red and underlined.', Jii.helpers.Console.FG_RED, Jii.helpers.Console.UNDERLINE);
     * ```
     *
     * @param {string} string the string to be formatted
     * @returns {string}
     */
    ansiFormat(string) {
        if (this.isColorEnabled()) {
            string = Console.ansiFormat(string, _toArray(arguments).slice(1));
        }
        return string;
    }

    /**
     * Prints a string to STDOUT
     *
     * You may optionally format the string with ANSI codes by
     * passing additional parameters using the constants defined in [[Jii.helpers.Console]].
     *
     * Example:
     *
     * ```
     * this.stdout('This will be red and underlined.', Jii.helpers.Console.FG_RED, Jii.helpers.Console.UNDERLINE);
     * ```
     *
     * @param {string} string the string to print
     * @returns {int|boolean} Number of bytes printed or false on error
     */
    stdout(string) {
        if (this.isColorEnabled()) {
            string = Console.ansiFormat(string, _toArray(arguments).slice(1));
        }
        Console.stdout(string);
    }

    /**
     * Prints a string to STDERR
     *
     * You may optionally format the string with ANSI codes by
     * passing additional parameters using the constants defined in [[Jii.helpers.Console]].
     *
     * Example:
     *
     * ```
     * this.stderr('This will be red and underlined.', Jii.helpers.Console.FG_RED, Jii.helpers.Console.UNDERLINE);
     * ```
     *
     * @param {string} string the string to print
     * @returns {int|boolean} Number of bytes printed or false on error
     */
    stderr(string) {
        if (this.isColorEnabled()) {
            string = Console.ansiFormat(string, _toArray(arguments).slice(1));
        }
        Console.stderr(string);
    }

    /**
     * Prompts the user for input and validates it
     *
     * @param {string} text prompt string
     * @param {[]} options the options to validate the input:
     *
     *  - required: whether it is required or not
     *  - default: default value if no input is inserted by the user
     *  - pattern: regular expression pattern to validate user input
     *  - validator: a callable function to validate input. The function must accept two parameters:
     *      - input: the user input to validate
     *      - error: the error value passed by reference if validation failed.
     * @returns {Promise} the user input
     */
    prompt(text, options) {
        options = options || [];

        if (this.interactive) {
            return Console.prompt(text, options);
        } else {
            return Promise.resolve(options['default'] || '');
        }
    }

    /**
     * Asks user to confirm by typing y or n.
     *
     * @param {string} message to echo out before waiting for user input
     * @param {boolean} [defaultValue] this value is returned if no selection is made.
     * @returns {Promise}
     */
    confirm(message, defaultValue) {
        defaultValue = defaultValue || false;

        if (this.interactive) {
            return Console.confirm(message, defaultValue);
        } else {
            return Promise.resolve(true);
        }
    }

    /**
     * Gives the user an option to choose from. Giving '?' as an input will show
     * a list of options to choose from and their explanations.
     *
     * @param {string} prompt the prompt message
     * @param {[]} options Key-value array of options to choose from
     *
     * @returns {Promise} An option character the user chose
     */
    select(prompt, options) {
        options = options || [];

        return Console.select(prompt, options);
    }

    /**
     * Returns the names of valid options for the action (id)
     * An option requires the existence of a public member variable whose
     * name is the option name.
     * Child classes may override this method to specify possible options.
     *
     * Note that the values setting via options are not available
     * until [[beforeAction()]] is being called.
     *
     * @param {string} actionID the action id of the current request
     * @returns {[]} the names of the options valid for the action
     */
    options(actionID) {
        // actionId might be used in subclasses to provide options specific to action id
        return [
            'color',
            'interactive'
        ];
    }

    /**
     * Returns properties corresponding to the options for the action id
     * Child classes may override this method to specify possible properties.
     *
     * @param {string} actionID the action id of the current request
     * @returns {object} properties corresponding to the options for the action
     */
    getOptionValues(actionID) {
        // actionId might be used in subclasses to provide properties specific to action id
        var properties = {};
        _each(this.options(this.action.id), property => {
            properties[property] = this.get(property);
        });
        return properties;
    }

    /**
     * Returns the names of valid options passed during execution.
     *
     * @returns {[]} the names of the options passed during execution
     */
    getPassedOptions() {
        return this._passedOptions;
    }

    /**
     * Returns the properties corresponding to the passed options
     *
     * @returns {object} the properties corresponding to the passed options
     */
    getPassedOptionValues() {
        var properties = {};
        _each(this._passedOptions, property => {
            properties[property] = this.get(property);
        });
        return properties;
    }

    /**
     * Returns one-line short summary describing this controller.
     *
     * You may override this method to return customized summary.
     * The default implementation returns first line from the PHPDoc comment.
     *
     * @returns {string}
     */
    getHelpSummary() {
        return this._parseDocCommentSummary();
    }

    /**
     * Returns help information for this controller.
     *
     * You may override this method to return customized help.
     * The default implementation returns help information retrieved from the PHPDoc comment.
     * @returns {string}
     */
    getHelp() {
        return this._parseDocCommentDetail();
    }

    /**
     * Returns a one-line short summary describing the specified action.
     * @param {Jii.console.Action} action action to get summary for
     * @returns {string} a one-line short summary describing the specified action.
     */
    getActionHelpSummary(action) {
        return this._parseDocCommentSummaryForAction(action.id);
    }

    /**
     * Returns the detailed help information for the specified action.
     * @param {Jii.console.Action} action action to get help for
     * @returns {string} the detailed help information for the specified action.
     */
    getActionHelp(action) {
        return this._parseDocCommentDetailForAction(action.id);
    }

    /**
     * Returns the help information for the anonymous arguments for the action.
     * The returned value should be an array. The keys are the argument names, and the values are
     * the corresponding help information. Each value must be an array of the following structure:
     *
     * - required: boolean, whether this argument is required.
     * - type: string, the js type of this argument.
     * - default: string, the default value of this argument
     * - comment: string, the comment of this argument
     *
     * The default implementation will return the help information extracted from the doc-comment of
     * the parameters corresponding to the action method.
     *
     * @param {Jii.console.Action} action
     * @returns {[]} the help information of the action arguments
     */
    getActionArgsHelp(action) {
        return this.getActionHelp(action).params;
    }

    /**
     * Returns the help information for the options for the action.
     * The returned value should be an array. The keys are the option names, and the values are
     * the corresponding help information. Each value must be an array of the following structure:
     *
     * - type: string, the js type of this argument.
     * - default: string, the default value of this argument
     * - comment: string, the comment of this argument
     *
     * The default implementation will return the help information extracted from the doc-comment of
     * the properties corresponding to the action options.
     *
     * @param {Jii.console.Action} action
     * @returns {object} the help information of the action options
     */
    getActionOptionsHelp(action) {
        var optionNames = this.options(action.id);
        if (_isEmpty(optionNames)) {
            return [];
        }

        var options = {};
        _each(this, (property, name) => {
            if (_isFunction(this[name]) || _indexOf(optionNames, name) === -1) {
                return;
            }

            var defaultValue = this[name];
            var tags = this._parseDocCommentTags(name);

            if (tags && (tags.var !== undefined || tags.property !== undefined)) {
                options[name] = !_isUndefined(tags.var) ? tags.var : tags.property;
                options[name].default = defaultValue;
            } else {
                options[name] = {
                    type: null,
                    default: defaultValue,
                    comment: ''
                };
            }
        });

        return options;
    }

    /**
     * Returns the first line of docblock.
     *
     * @returns {string}
     */
    _parseDocCommentSummary() {
        this._loadComments();
        return this._comments.main && this._comments.main.help || '';
    }

    /**
     * Returns the first line of docblock for some action.
     *
     * @param {string} id of action
     * @returns {string}
     */
    _parseDocCommentSummaryForAction(id) {
        this._loadComments();
        return this._comments.actions[id] && this._comments.actions[id].help || '';
    }

    /**
     * Returns full description from the main docblock.
     *
     * @returns {string}
     */
    _parseDocCommentDetail() {
        this._loadComments();
        return this._comments.main && this._comments.main.description || '';
    }

    /**
     * Returns full description from the action docblock.
     *
     * @param {string} id of action
     * @returns {string}
     */
    _parseDocCommentDetailForAction(id) {
        this._loadComments();
        return this._comments.actions[id] && this._comments.actions[id].description || '';
    }

    /**
     * Returns object of information about some property from the docblock.
     *
     * @param {string} property name
     * @returns {object}
     */
    _parseDocCommentTags(property) {
        this._loadComments();
        return this._comments.properties[property] || null;
    }

    /**
     *
     * @private
     */
    _loadComments() {
        if (this._comments) {
            return;
        }

        var comments = _values(extract(/*fs.readFileSync(classPath, 'utf-8')*/'')); // TODO
        var exp = /^action(.*)(:|\()(.*)/i;
        var exp2 = /\n@/gi;
        var exp3 = /^@/i;
        var propertyDataExp = /^@(var|property) (\w+) ((.|[\s\S])*)/;
        var propertyExp = /^@(var|property)(.*)/i;
        var paramExp = /^@param(.*)/i;
        var paramDataExp = /^@param \{(\w+)\} (\w+) ((.|[\s\S])*)/i;

        this._comments = {
            main: {
                help: '',
                description: ''
            },
            properties: {},
            actions: {}
        };

        _each(comments, (comment, i) => {
            var content = comment.content.split('\n');
            var fakeContent = comment.content.replace(exp2, '\n@@');
            var fakeArr = fakeContent.split(exp2);
            var description = _compact(fakeArr.map(line => exp3.test(line) ? '' : line)).join('\n');
            description = _trim(description, '\n');

            if (comment.code && exp.test(comment.code)) {
                var actionId = comment.code.replace(exp, '$1').toLowerCase();
                // @todo lowercase is wrong. need convert AaBb to aa-bb.
                if (this._comments.actions[actionId] === undefined) {
                    this._comments.actions[actionId] = {
                        help: '',
                        params: {}
                    };
                }

                this._comments.actions[actionId].help = content !== undefined && content[0] !== '' ? content[0] : '';
                var params = _compact(fakeArr.map(line => exp3.test(line) ? line : ''));

                this._comments.actions[actionId].description = description;

                _each(params, line => {
                    if (paramExp.test(line)) {
                        var arr = line.replace(paramDataExp, '$1{SEP}$2{SEP}$3').split('{SEP}');

                        this._comments.actions[actionId].params[arr[1]] = {
                            type: arr[0],
                            comment: arr[2]
                        };
                    }
                });
            } else if (propertyExp.test(comment.content)) {
                var pName = comment.code.split(':')[0];
                var arr = comment.content.replace(propertyDataExp, '$1{SEP}$2{SEP}$3').split('{SEP}');

                if (this._comments.properties[pName] === undefined) {
                    this._comments.properties[pName] = {};
                }

                this._comments.properties[pName][arr[0]] = {
                    type: arr[1],
                    comment: arr[2]
                };
            }
        });
    }

}
Controller.EXIT_CODE_ERROR = 1;

Controller.EXIT_CODE_NORMAL = 0;
module.exports = Controller;