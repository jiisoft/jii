/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

var Jii = require('../../../BaseJii');
var QueueInterface = require('./QueueInterface');

class Blank extends QueueInterface {

    preInit() {
        this._queue = [];

        super.preInit(...arguments);
    }

    /**
     * Add message to queue
     * @param {string} message
     */
    push(message) {
        return new Promise(resolve => {
            this._queue.push(message);
            setTimeout(() => resolve());
        });
    }

    /**
     * Get and remove message from queue
     * @returns Promise
     */
    pop() {
        return new Promise(resolve => {
            const message = this._queue.shift() || null;
            setTimeout(() => resolve(message));
        });
    }

}
module.exports = Blank;