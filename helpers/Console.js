/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

var Jii = require('jii');
var _trim = require('lodash/trim');
var _isString = require('lodash/isString');
var _extend = require('lodash/extend');
var _keys = require('lodash/keys');
var _each = require('lodash/each');
var _has = require('lodash/has');
var Object = require('jii/base/Object');
var keypress = require('keypress');

/**
 * @class Jii.helpers.Console
 * @extends Jii.base.Object
 */
var Console = Jii.defineClass('Jii.helpers.Console', /** @lends Jii.helpers.Console.prototype */{

    __extends: Object,

    __static: /** @lends Jii.helpers.Console */{

        FG_BLACK: 30,
        FG_RED: 31,
        FG_GREEN: 32,
        FG_YELLOW: 33,
        FG_BLUE: 34,
        FG_PURPLE: 35,
        FG_CYAN: 36,
        FG_GREY: 37,

        BG_BLACK: 40,
        BG_RED: 41,
        BG_GREEN: 42,
        BG_YELLOW: 43,
        BG_BLUE: 44,
        BG_PURPLE: 45,
        BG_CYAN: 46,
        BG_GREY: 47,

        RESET: 0,
        NORMAL: 0,
        BOLD: 1,
        ITALIC: 3,
        UNDERLINE: 4,
        BLINK: 5,
        NEGATIVE: 7,
        CONCEALED: 8,
        CROSSED_OUT: 9,
        FRAMED: 51,
        ENCIRCLED: 52,
        OVERLINED: 53,

        /**
         * Moves the terminal cursor up by sending ANSI control code CUU to the terminal.
         * If the cursor is already at the edge of the screen, this has no effect.
         * @param {number} rows number of rows the cursor should be moved up
         */
        moveCursorUp(rows) {
            rows = rows || '';

            console.log('\u001b[' + rows + 'A');
        },

        /**
         * Moves the terminal cursor down by sending ANSI control code CUD to the terminal.
         * If the cursor is already at the edge of the screen, this has no effect.
         * @param {number} rows number of rows the cursor should be moved down
         */
        moveCursorDown(rows) {
            rows = rows || '';

            console.log('\u001b[' + rows + 'B');
        },

        /**
         * Moves the terminal cursor forward by sending ANSI control code CUF to the terminal.
         * If the cursor is already at the edge of the screen, this has no effect.
         * @param {number} steps number of steps the cursor should be moved forward
         */
        moveCursorForward(steps) {
            steps = steps || '';

            console.log('\u001b[' + steps + 'C');
        },

        /**
         * Moves the terminal cursor backward by sending ANSI control code CUB to the terminal.
         * If the cursor is already at the edge of the screen, this has no effect.
         * @param {number} steps number of steps the cursor should be moved backward
         */
        moveCursorBackward(steps) {
            steps = steps || '';

            console.log('\u001b[' + steps + 'D');
        },

        /**
         * Moves the terminal cursor to the beginning of the next line by sending ANSI control code CNL to the terminal.
         * @param {number} lines number of lines the cursor should be moved down
         */
        moveCursorNextLine(lines) {
            lines = lines || '';

            console.log('\u001b[' + lines + 'E');
        },

        /**
         * Moves the terminal cursor to the beginning of the previous line by sending ANSI control code CPL to the terminal.
         * @param {number} lines number of lines the cursor should be moved up
         */
        moveCursorPrevLine(lines) {
            lines = lines || '';

            console.log('\u001b[' + lines + 'F');
        },

        /**
         * Moves the cursor to an absolute position given as column and row by sending ANSI control code CUP or CHA to the terminal.
         * @param {number} column 1-based column number, 1 is the left edge of the screen.
         * @param {number|null} row 1-based row number, 1 is the top edge of the screen. if not set, will move cursor only in current line.
         */
        moveCursorTo(column, row) {
            row = row || null;

            if (row === null) {
                console.log('\u001b[' + column + 'G');
            } else {
                console.log('\u001b[' + row + ';' + column + 'H');
            }
        },

        /**
         * Scrolls whole page up by sending ANSI control code SU to the terminal.
         * New lines() are added at the bottom. This is not supported by ANSI.SYS used in windows.
         * @param {number} lines number of lines to scroll up
         */
        scrollUp(lines) {
            lines = lines || '';

            console.log('\u001b[' + lines + 'S');
        },

        /**
         * Scrolls whole page down by sending ANSI control code SD to the terminal.
         * New lines() are added at the top. This is not supported by ANSI.SYS used in windows.
         * @param {number} lines number of lines to scroll down
         */
        scrollDown(lines) {
            lines = lines || '';

            console.log('\u001b[' + lines + 'T');
        },

        /**
         * Saves the current cursor position by sending ANSI control code SCP to the terminal.
         * Position can then be restored with [[restoreCursorPosition()]].
         */
        saveCursorPosition() {
            console.log('\u001b[s');
        },

        /**
         * Restores the cursor position saved with [[saveCursorPosition()]] by sending ANSI control code RCP to the terminal.
         */
        restoreCursorPosition() {
            console.log('\u001b[u');
        },

        /**
         * Hides the cursor by sending ANSI DECTCEM code ?25l to the terminal.
         * Use [[showCursor()]] to bring it back.
         * Do not forget to show cursor when your application exits. Cursor might stay hidden in terminal after exit.
         */
        hideCursor() {
            console.log('\u001b[?25l');
        },

        /**
         * Will show a cursor again when it has been hidden by [[hideCursor()]]  by sending ANSI DECTCEM code ?25h to the terminal.
         */
        showCursor() {
            console.log('\u001b[?25h');
        },

        /**
         * Clears entire screen content by sending ANSI control code ED with argument 2 to the terminal.
         * Cursor position will not be changed.
         * **Note:** ANSI.SYS implementation used in windows will reset cursor position to upper left corner of the screen.
         */
        clearScreen() {
            console.log('\u001b[2J');
        },

        /**
         * Clears text from cursor to the beginning of the screen by sending ANSI control code ED with argument 1 to the terminal.
         * Cursor position will not be changed.
         */
        clearScreenBeforeCursor() {
            console.log('\u001b[1J');
        },

        /**
         * Clears text from cursor to the end of the screen by sending ANSI control code ED with argument 0 to the terminal.
         * Cursor position will not be changed.
         */
        clearScreenAfterCursor() {
            console.log('\u001b[0J');
        },

        /**
         * Clears the line, the cursor is currently on by sending ANSI control code EL with argument 2 to the terminal.
         * Cursor position will not be changed.
         */
        clearLine() {
            console.log('\u001b[2K');
        },

        /**
         * Clears text from cursor position to the beginning of the line by sending ANSI control code EL with argument 1 to the terminal.
         * Cursor position will not be changed.
         */
        clearLineBeforeCursor() {
            console.log('\u001b[1K');
        },

        /**
         * Clears text from cursor position to the end of the line by sending ANSI control code EL with argument 0 to the terminal.
         * Cursor position will not be changed.
         */
        clearLineAfterCursor() {
            console.log('\u001b[0K');
        },

        /**
         * Returns the ANSI format code.
         *
         * @param {[]} format An array containing formatting values.
         * You can pass any of the FG_*, BG_* and TEXT_* constants
         * and also [[xtermFgColor]] and [[xtermBgColor]] to specify a format.
         * @returns {string} The ANSI format code according to the given formatting constants.
         */
        ansiFormatCode(format) {
            return '\u001b[' + format.join(';') + 'm';
        },

        /**
         * Echoes an ANSI format code that affects the formatting of any text that is printed afterwards.
         *
         * @param {[]} format An array containing formatting values.
         * You can pass any of the FG_*, BG_* and TEXT_* constants
         * and also [[xtermFgColor]] and [[xtermBgColor]] to specify a format.
         * @see ansiFormatCode()
         * @see endAnsiFormat()
         */
        beginAnsiFormat(format) {
            console.log('\u001b[' + format.join(';') + 'm');
        },

        /**
         * Resets any ANSI format set by previous method [[beginAnsiFormat()]]
         * Any output after this will have default text format.
         * This is equal to calling
         *
         * ```js
         * console.log(Console.ansiFormatCode([Console.RESET])
         * ```
         */
        endAnsiFormat() {
            console.log('\u001b[0m');
        },

        /**
         * Will return a string formatted with the given ANSI style
         *
         * @param {string} string the string to be formatted
         * @param {[]} format An array containing formatting values.
         * You can pass any of the FG_*, BG_* and TEXT_* constants
         * and also [[xtermFgColor]] and [[xtermBgColor]] to specify a format.
         * @returns {string}
         */
        ansiFormat(string, format) {
            format = format || [];

            var code = format.join(';');

            return '\u001b[0m' + (code !== '' ? '\u001b[' + code + 'm' : '') + string + '\u001b[0m';
        },

        /**
         * Returns the ansi format code for xterm foreground color.
         * You can pass the return value of this to one of the formatting methods:
         * [[ansiFormat]], [[ansiFormatCode]], [[beginAnsiFormat]]
         *
         * @param {number} colorCode xterm color code
         * @returns {string}
         * @see http://en.wikipedia.org/wiki/Talk:ANSI_escape_code#xterm-256colors
         */
        xtermFgColor(colorCode) {
            return '38;5;' + colorCode;
        },

        /**
         * Returns the ansi format code for xterm background color.
         * You can pass the return value of this to one of the formatting methods:
         * [[ansiFormat]], [[ansiFormatCode]], [[beginAnsiFormat]]
         *
         * @param {number} colorCode xterm color code
         * @returns {string}
         * @see http://en.wikipedia.org/wiki/Talk:ANSI_escape_code#xterm-256colors
         */
        xtermBgColor(colorCode) {
            return '48;5;' + colorCode;
        },

        /**
         * Strips ANSI control codes from a string
         *
         * @param {string} string String to strip
         * @returns {string}
         */
        stripAnsiFormat(string) {
            return string.replace('/\u001b\[[\d;?]*\w/g', '');
        },

        /**
         * Returns the length of the string without ANSI color codes.
         * @param {string} string the string to measure
         * @returns {number} the length of the string not counting ANSI format characters
         */
        ansiStrlen(string) {
            return this.__static.stripAnsiFormat(string).length;
        },

        /**
         * Word wrap text with indentation to fit the screen size
         *
         * If screen size could not be detected, or the indentation is greater than the screen size, the text will not be wrapped.
         *
         * The first line will **not** be indented, so `Console.wrapText("Lorem ipsum dolor sit amet.", 4)` will result in the
         * following output, given the screen width is 16 characters:
         *
         * ```
         * Lorem ipsum
         *     dolor sit
         *     amet.
         * ```
         *
         * @param {string} text the text to be wrapped
         * @param {number} indent number of spaces to use for indentation.
         * @param {boolean} [refresh] whether to force refresh of screen size.
         * This will be passed to [[getScreenSize()]].
         * @returns {string} the wrapped text.
         */
        wrapText(text, indent, refresh) {
            return text; // @todo
        },

        /**
         * Gets input from STDIN and returns a string right-trimmed for EOLs.
         *
         * @param {boolean} raw If set to true, returns the raw string without trimming
         * @returns {string} the string read from stdin
         */
        stdin(raw) {
            raw = raw || false;

            //@todo return raw ? fgets(\STDIN) : rtrim(fgets(\STDIN), PHP_EOL);
        },

        /**
         * Prints a string to STDOUT.
         *
         * @param {string} string the string to print
         */
        stdout(string) {
            process.stdout.write(string);
        },

        /**
         * Prints a string to STDERR.
         *
         * @param {string} string the string to print
         * @returns {int|boolean} Number of bytes printed or false on error
         */
        stderr(string) {
            process.stderr.write(string);
        },

        /**
         * Asks the user for input. Ends when the user types a carriage return (PHP_EOL). Optionally, It also provides a
         * prompt.
         *
         * @param {string} [prompt] the prompt to display before waiting for input (optional)
         * @returns {Promise}
         */
        input(prompt) {
            prompt = prompt || '';

            if (prompt) {
                this.__static.stdout(prompt);
            }

            return new Promise(resolve => {
                keypress(process.stdin);

                var line = '';
                var listen = (c, key) => {
                    if (key) {
                        if (key.ctrl && key.name === 'c') {
                            process.exit();
                        }

                        if (key.name === 'return'){
                            return;
                        }

                        if (key.name === 'enter') {
                            process.stdin.removeListener('keypress', listen);
                            process.stdin.pause();
                            resolve(line.trim());
                            return;
                        }

                        if (key.name === 'backspace') {
                            line = line.slice(0, -1);
                        }
                    }
                    if (!key || key.name !== 'backspace') {
                        line += c;
                    }
                }

                process.stdin.on('keypress', listen).resume();
            });
        },

        /**
         * Prints text to STDOUT appended with a carriage return (PHP_EOL).
         *
         * @param {string} string the text to print
         * @returns {number|boolean} number of bytes printed or false on error.
         */
        output(string) {
            string = string || null;

            return this.__static.stdout(string + '\n');
        },

        /**
         * Prints text to STDERR appended with a carriage return (PHP_EOL).
         *
         * @param {string} string the text to print
         * @returns {number|boolean} number of bytes printed or false on error.
         */
        error(string) {
            string = string || null;

            return this.__static.stderr(string + '\n');
        },

        /**
         * Prompts the user for input and validates it
         *
         * @param {string} text prompt string
         * @param {object} options the options to validate the input:
         *
         * - `required`: whether it is required or not
         * - `default`: default value if no input is inserted by the user
         * - `pattern`: regular expression pattern to validate user input
         * - `validator`: a callable function to validate input. The function must accept two parameters:
         * - `input`: the user input to validate
         * - `error`: the error value passed by reference if validation failed.
         *
         * @returns {Promise}
         */
        prompt(text, options) {
            options = options || {};
            options = _extend({
                required: false,
                'default': null,
                pattern: null,
                validator: null,
                error: 'Invalid input.'
            }, options);

            var ask = () => {
                var inputText = text + (options['default'] ? ' [' + options['default'] + '] ' : '');
                return this.__static.input(inputText).then(val => {
                    val = String(val);

                    if (val.length === 0) {
                        if (options['default']) {
                            val = options['default'];
                        } else if (options.required) {
                            this.__static.output(options['error']);
                            return ask();
                        }
                    } else if (options.pattern && !val.match(options.pattern)) {
                        this.__static.output(options['error']);
                        return ask();
                    } else if (options.validator) {
                        var error = options.validator.call(null, val);
                        if (_isString(error) || error === false) {
                            this.__static.output(_isString(error) ? error : options['error']);
                            return ask();
                        }
                    }

                    return val;
                });
            };

            return ask();
        },

        /**
         * Asks user to confirm by typing y or n.
         *
         * @param {string} message to print out before waiting for user input
         * @param {boolean} [defaultValue] this value is returned if no selection is made.
         * @returns {Promise}
         */
        confirm(message, defaultValue) {
            defaultValue = defaultValue || false;

            return this.__static.input(message + ' (yes|no) [' + (defaultValue ? 'yes' : 'no') + ']:').then(val => {
                val = _trim(val).toLowerCase();

                if (val.length === 0) {
                    return defaultValue;
                }

                if (val === 'y' || val === 'yes') {
                    return true;
                }
                if (val === 'n' || val === 'no') {
                    return false;
                }

                return this.__static.confirm(message, defaultValue)
            });
        },

        /**
         * Gives the user an option to choose from. Giving '?' as an input will show
         * a list of options to choose from and their explanations.
         *
         * @param {string} prompt the prompt message
         * @param {object} options Key-value array of options to choose from
         *
         * @returns {Promise}
         */
        select(prompt, options) {
            options = options || {};

            this.__static.stdout(prompt + ' [' + _keys(options).join(',') + ",?]: ");

            var ask = () => {
                return this.__static.input().then(input => {
                    if (input === '?') {
                        _each(options, (value, key) => {
                            this.__static.output(' ' + key + ' - ' + value);
                        });
                        this.__static.output(' ? - Show help');
                        return ask();
                    } else if (!_has(options, input)) {
                        return ask();
                    }
                    return input;
                });
            };
            return ask();
        }

    }

});

module.exports = Console;