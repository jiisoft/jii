/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

class ApplicationException extends Error {

    preInit(message) {
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
        this.name = this.constructor.name;
        this.message = message || '';
    }

}

module.exports = ApplicationException;