/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */

'use strict';

const Jii = require('../BaseJii');
const Event = require('../base/Event');

class ViewEvent extends Event {

    preInit() {
        /**
         * @type {boolean} whether to continue rendering the view file. Event handlers of
         * [[EVENT_BEFORE_RENDER]] may set this property to decide whether
         * to continue rendering the current view file.
         */
        this.isValid = true;

        /**
         * @type {string} the rendering result of [[renderFile()]].
         * Event handlers may modify this property and the modified output will be
         * returned by [[renderFile()]]. This property is only used
         * by [[EVENT_AFTER_RENDER]] event.
         */
        this.output = null;

        /**
         * @type {[]} the parameter array passed to the [[render()]] method.
         */
        this.params = null;

        /**
         * @type {string} the view file being rendered.
         */
        this.viewFile = null;

        super.preInit(...arguments);
    }

}
module.exports = ViewEvent;