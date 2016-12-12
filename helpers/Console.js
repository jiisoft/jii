/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */
'use strict';

var Jii = require('../index');
var _trim = require('lodash/trim');
var _isString = require('lodash/isString');
var _extend = require('lodash/extend');
var _keys = require('lodash/keys');
var _each = require('lodash/each');
var _has = require('lodash/has');
var Object = require('../base/Object');
var keypress = require('keypress');
class Console extends Object {

    /**
         * Moves the terminal cursor up by sending ANSI control code CUU to the terminal.
         * If the cursor is already at the edge of the screen, this has no effect.
         * @param {number} rows number of rows the cursor should be moved up
         */
    static moveCursorUp(rows) {
        rows = rows || '';

        console.log('\x1B[' + rows + 'A');
    }

    /**
         * Moves the terminal cursor down by sending ANSI control code CUD to the terminal.
         * If the cursor is already at the edge of the screen, this has no effect.
         * @param {number} rows number of rows the cursor should be moved down
         */
    static moveCursorDown(rows) {
        rows = rows || '';

        console.log('\x1B[' + rows + 'B');
    }

    /**
         * Moves the terminal cursor forward by sending ANSI control code CUF to the terminal.
         * If the cursor is already at the edge of the screen, this has no effect.
         * @param {number} steps number of steps the cursor should be moved forward
         */
    static moveCursorForward(steps) {
        steps = steps || '';

        console.log('\x1B[' + steps + 'C');
    }

    /**
         * Moves the terminal cursor backward by sending ANSI control code CUB to the terminal.
         * If the cursor is already at the edge of the screen, this has no effect.
         * @param {number} steps number of steps the cursor should be moved backward
         */
    static moveCursorBackward(steps) {
        steps = steps || '';

        console.log('\x1B[' + steps + 'D');
    }

    /**
         * Moves the terminal cursor to the beginning of the next line by sending ANSI control code CNL to the terminal.
         * @param {number} lines number of lines the cursor should be moved down
         */
    static moveCursorNextLine(lines) {
        lines = lines || '';

        console.log('\x1B[' + lines + 'E');
    }

    /**
         * Moves the terminal cursor to the beginning of the previous line by sending ANSI control code CPL to the terminal.
         * @param {number} lines number of lines the cursor should be moved up
         */
    static moveCursorPrevLine(lines) {
        lines = lines || '';

        console.log('\x1B[' + lines + 'F');
    }

    /**
         * Moves the cursor to an absolute position given as column and row by sending ANSI control code CUP or CHA to the terminal.
         * @param {number} column 1-based column number, 1 is the left edge of the screen.
         * @param {number|null} row 1-based row number, 1 is the top edge of the screen. if not set, will move cursor only in current line.
         */
    static moveCursorTo(column, row) {
        row = row || null;

        if (row === null) {
            console.log('\x1B[' + column + 'G');
        } else {
            console.log('\x1B[' + row + ';' + column + 'H');
        }
    }

    /**
         * Scrolls whole page up by sending ANSI control code SU to the terminal.
         * New lines() are added at the bottom. This is not supported by ANSI.SYS used in windows.
         * @param {number} lines number of lines to scroll up
         */
    static scrollUp(lines) {
        lines = lines || '';

        console.log('\x1B[' + lines + 'S');
    }

    /**
         * Scrolls whole page down by sending ANSI control code SD to the terminal.
         * New lines() are added at the top. This is not supported by ANSI.SYS used in windows.
         * @param {number} lines number of lines to scroll down
         */
    static scrollDown(lines) {
        lines = lines || '';

        console.log('\x1B[' + lines + 'T');
    }

    /**
         * Saves the current cursor position by sending ANSI control code SCP to the terminal.
         * Position can then be restored with [[restoreCursorPosition()]].
         */
    static saveCursorPosition() {
        console.log('\x1B[s');
    }

    /**
         * Restores the cursor position saved with [[saveCursorPosition()]] by sending ANSI control code RCP to the terminal.
         */
    static restoreCursorPosition() {
        console.log('\x1B[u');
    }

    /**
         * Hides the cursor by sending ANSI DECTCEM code ?25l to the terminal.
         * Use [[showCursor()]] to bring it back.
         * Do not forget to show cursor when your application exits. Cursor might stay hidden in terminal after exit.
         */
    static hideCursor() {
        console.log('\x1B[?25l');
    }

    /**
         * Will show a cursor again when it has been hidden by [[hideCursor()]]  by sending ANSI DECTCEM code ?25h to the terminal.
         */
    static showCursor() {
        console.log('\x1B[?25h');
    }

    /**
         * Clears entire screen content by sending ANSI control code ED with argument 2 to the terminal.
         * Cursor position will not be changed.
         * **Note:** ANSI.SYS implementation used in windows will reset cursor position to upper left corner of the screen.
         */
    static clearScreen() {
        console.log('\x1B[2J');
    }

    /**
         * Clears text from cursor to the beginning of the screen by sending ANSI control code ED with argument 1 to the terminal.
         * Cursor position will not be changed.
         */
    static clearScreenBeforeCursor() {
        console.log('\x1B[1J');
    }

    /**
         * Clears text from cursor to the end of the screen by sending ANSI control code ED with argument 0 to the terminal.
         * Cursor position will not be changed.
         */
    static clearScreenAfterCursor() {
        console.log('\x1B[0J');
    }

    /**
         * Clears the line, the cursor is currently on by sending ANSI control code EL with argument 2 to the terminal.
         * Cursor position will not be changed.
         */
    static clearLine() {
        console.log('\x1B[2K');
    }

    /**
         * Clears text from cursor position to the beginning of the line by sending ANSI control code EL with argument 1 to the terminal.
         * Cursor position will not be changed.
         */
    static clearLineBeforeCursor() {
        console.log('\x1B[1K');
    }

    /**
         * Clears text from cursor position to the end of the line by sending ANSI control code EL with argument 0 to the terminal.
         * Cursor position will not be changed.
         */
    static clearLineAfterCursor() {
        console.log('\x1B[0K');
    }

    /**
         * Returns the ANSI format code.
         *
         * @param {[]} format An array containing formatting values.
         * You can pass any of the FG_*, BG_* and TEXT_* constants
         * and also [[xtermFgColor]] and [[xtermBgColor]] to specify a format.
         * @returns {string} The ANSI format code according to the given formatting constants.
         */
    static ansiFormatCode(format) {
        return '\x1B[' + format.join(';') + 'm';
    }

    /**
         * Echoes an ANSI format code that affects the formatting of any text that is printed afterwards.
         *
         * @param {[]} format An array containing formatting values.
         * You can pass any of the FG_*, BG_* and TEXT_* constants
         * and also [[xtermFgColor]] and [[xtermBgColor]] to specify a format.
         * @see ansiFormatCode()
         * @see endAnsiFormat()
         */
    static beginAnsiFormat(format) {
        console.log('\x1B[' + format.join(';') + 'm');
    }

    /**
         * Resets any ANSI format set by previous method [[beginAnsiFormat()]]
         * Any output after this will have default text format.
         * This is equal to calling
         *
         * ```js
         * console.log(Console.ansiFormatCode([Console.RESET])
         * ```
         */
    static endAnsiFormat() {
        console.log('\x1B[0m');
    }

    /**
         * Will return a string formatted with the given ANSI style
         *
         * @param {string} string the string to be formatted
         * @param {[]} format An array containing formatting values.
         * You can pass any of the FG_*, BG_* and TEXT_* constants
         * and also [[xtermFgColor]] and [[xtermBgColor]] to specify a format.
         * @returns {string}
         */
    static ansiFormat(string, format) {
        format = format || [];

        var code = format.join(';');

        return '\x1B[0m' + (code !== '' ? '\x1B[' + code + 'm' : '') + string + '\x1B[0m';
    }

    /**
         * Returns the ansi format code for xterm foreground color.
         * You can pass the return value of this to one of the formatting methods:
         * [[ansiFormat]], [[ansiFormatCode]], [[beginAnsiFormat]]
         *
         * @param {number} colorCode xterm color code
         * @returns {string}
         * @see http://en.wikipedia.org/wiki/Talk:ANSI_escape_code#xterm-256colors
         */
    static xtermFgColor(colorCode) {
        return '38;5;' + colorCode;
    }

    /**
         * Returns the ansi format code for xterm background color.
         * You can pass the return value of this to one of the formatting methods:
         * [[ansiFormat]], [[ansiFormatCode]], [[beginAnsiFormat]]
         *
         * @param {number} colorCode xterm color code
         * @returns {string}
         * @see http://en.wikipedia.org/wiki/Talk:ANSI_escape_code#xterm-256colors
         */
    static xtermBgColor(colorCode) {
        return '48;5;' + colorCode;
    }

    /**
         * Strips ANSI control codes from a string
         *
         * @param {string} string String to strip
         * @returns {string}
         */
    static stripAnsiFormat(string) {
        return string.replace('/\x1B[[d;?]*w/g', '');
    }

    /**
         * Returns the length of the string without ANSI color codes.
         * @param {string} string the string to measure
         * @returns {number} the length of the string not counting ANSI format characters
         */
    static ansiStrlen(string) {
        return this.constructor.stripAnsiFormat(string).length;
    }

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
    static wrapText(text, indent, refresh) {
        return text; // @todo
    }

    /**
         * Gets input from STDIN and returns a string right-trimmed for EOLs.
         *
         * @param {boolean} raw If set to true, returns the raw string without trimming
         * @returns {string} the string read from stdin
         */
    static stdin(raw) {
        raw = raw || false;
    //@todo return raw ? fgets(\STDIN) : rtrim(fgets(\STDIN), PHP_EOL);
    }

    /**
         * Prints a string to STDOUT.
         *
         * @param {string} string the string to print
         */
    static stdout(string) {
        process.stdout.write(string);
    }

    /**
         * Prints a string to STDERR.
         *
         * @param {string} string the string to print
         * @returns {int|boolean} Number of bytes printed or false on error
         */
    static stderr(string) {
        process.stderr.write(string);
    }

    /**
         * Asks the user for input. Ends when the user types a carriage return (PHP_EOL). Optionally, It also provides a
         * prompt.
         *
         * @param {string} [prompt] the prompt to display before waiting for input (optional)
         * @returns {Promise}
         */
    static input(prompt) {
        prompt = prompt || '';

        if (prompt) {
            this.constructor.stdout(prompt);
        }

        return new Promise(resolve => {
            keypress(process.stdin);

            var line = '';
            var listen = (c, key) => {
                if (key) {
                    if (key.ctrl && key.name === 'c') {
                        process.exit();
                    }

                    if (key.name === 'return') {
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
            };

            process.stdin.on('keypress', listen).resume();
        });
    }

    /**
         * Prints text to STDOUT appended with a carriage return (PHP_EOL).
         *
         * @param {string} string the text to print
         * @returns {number|boolean} number of bytes printed or false on error.
         */
    static output(string) {
        string = string || null;

        return this.constructor.stdout(string + '\n');
    }

    /**
         * Prints text to STDERR appended with a carriage return (PHP_EOL).
         *
         * @param {string} string the text to print
         * @returns {number|boolean} number of bytes printed or false on error.
         */
    static error(string) {
        string = string || null;

        return this.constructor.stderr(string + '\n');
    }

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
    static prompt(text, options) {
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
            return this.constructor.input(inputText).then(val => {
                val = String(val);

                if (val.length === 0) {
                    if (options['default']) {
                        val = options['default'];
                    } else if (options.required) {
                        this.constructor.output(options['error']);
                        return ask();
                    }
                } else if (options.pattern && !val.match(options.pattern)) {
                    this.constructor.output(options['error']);
                    return ask();
                } else if (options.validator) {
                    var error = options.validator.call(null, val);
                    if (_isString(error) || error === false) {
                        this.constructor.output(_isString(error) ? error : options['error']);
                        return ask();
                    }
                }

                return val;
            });
        };

        return ask();
    }

    /**
         * Asks user to confirm by typing y or n.
         *
         * @param {string} message to print out before waiting for user input
         * @param {boolean} [defaultValue] this value is returned if no selection is made.
         * @returns {Promise}
         */
    static confirm(message, defaultValue) {
        defaultValue = defaultValue || false;

        return this.constructor.input(message + ' (yes|no) [' + (defaultValue ? 'yes' : 'no') + ']:').then(val => {
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

            return this.constructor.confirm(message, defaultValue);
        });
    }

    /**
         * Gives the user an option to choose from. Giving '?' as an input will show
         * a list of options to choose from and their explanations.
         *
         * @param {string} prompt the prompt message
         * @param {object} options Key-value array of options to choose from
         *
         * @returns {Promise}
         */
    static select(prompt, options) {
        options = options || {};

        this.constructor.stdout(prompt + ' [' + _keys(options).join(',') + ',?]: ');

        var ask = () => {
            return this.constructor.input().then(input => {
                if (input === '?') {
                    _each(options, (value, key) => {
                        this.constructor.output(' ' + key + ' - ' + value);
                    });
                    this.constructor.output(' ? - Show help');
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
Console.OVERLINED = 53;
Console.ENCIRCLED = 52;
Console.FRAMED = 51;
Console.CROSSED_OUT = 9;
Console.CONCEALED = 8;
Console.NEGATIVE = 7;
Console.BLINK = 5;
Console.UNDERLINE = 4;
Console.ITALIC = 3;
Console.BOLD = 1;
Console.NORMAL = 0;

Console.RESET = 0;
Console.BG_GREY = 47;
Console.BG_CYAN = 46;
Console.BG_PURPLE = 45;
Console.BG_BLUE = 44;
Console.BG_YELLOW = 43;
Console.BG_GREEN = 42;
Console.BG_RED = 41;

Console.BG_BLACK = 40;
Console.FG_GREY = 37;
Console.FG_CYAN = 36;
Console.FG_PURPLE = 35;
Console.FG_BLUE = 34;
Console.FG_YELLOW = 33;
Console.FG_GREEN = 32;
Console.FG_RED = 31;

Console.FG_BLACK = 30;
module.exports = Console;