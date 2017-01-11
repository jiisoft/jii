/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

const Jii = require('../../../BaseJii');
const Component = require('../../../base/Component');

class QueueInterface extends Component {

    /**
     * Start queue
     */
    start() {
    }

    /**
     * Stop queue
     */
    stop() {
    }

    /**
     * Add message to queue
     * @param message
     */
    push(message) {
    }

    /**
     * Get and remove message from queue
     * @returns Promise
     */
    pop() {
    }

}
module.exports = QueueInterface;