/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */
'use strict';

var Jii = require('../BaseJii');
var IRenderer = require('./IRenderer');
var InvalidConfigException = require('../exceptions/InvalidConfigException');
var ViewEvent = require('./ViewEvent');
var _isString = require('lodash/isString');
var _isFunction = require('lodash/isFunction');
var Component = require('../base/Component');
class View extends Component {

    preInit() {
        /**
     * @type {object}
     */
        this.renderers = process.env.JII_NO_NAMESPACE ? null : {
            react: {
                className: Jii.isNode ? 'Jii.react.ReactServerRenderer' : 'Jii.react.ReactRenderer'
            },
            underscore: {
                className: 'Jii.view.underscore.UnderscoreRenderer'
            }
        };
        /**
     * @type {Jii.view.IRenderer|null}
     */
        this.renderer = null;
        /**
     * @type {mixed} custom parameters that are shared among view templates.
     */
        this.params = null;
        super.preInit(...arguments);
    }

    getRenderer(view) {
        if (this.renderer instanceof IRenderer) {
            return this.renderer;
        }

        // Auto detect
        var name = View.RENDERER_UNDERSCORE;
        if (_isString(this.renderer)) {
            name = this.renderer;
        } else if (_isString(view) && view.indexOf('/') !== -1) {
            name = View.RENDERER_UNDERSCORE;
        } else if (_isString(view) && view.indexOf('.') !== -1) {
            view = Jii.namespace(view);
            name = View.RENDERER_REACT;
        } else if (_isFunction(view)) {
            name = View.RENDERER_REACT;
        }

        if (name) {
            if (!(this.renderers[name] instanceof IRenderer)) {
                this.renderers[name] = Jii.createObject(this.renderers[name]);
            }
            return this.renderers[name];
        }

        throw new InvalidConfigException('Not found renderer for view');
    }

    /**
     *
     * @param {*} view
     * @param {Jii.base.Context} context
     * @param {object} params
     * @param {Jii.base.Controller} controller
     * @returns {Promise}
     */
    render(view, context, params, controller) {
        params = params || {};
        context = context || null;

        return this.beforeRender(view, context, params).then(success => {
            if (!success) {
                return false;
            }

            var output = this.getRenderer(view).render(view, context, params, controller, this);
            return this.afterRender(view, context, params, output);
        });
    }

    /**
     *
     * @param viewFile
     * @param context
     * @param params
     * @returns {Promise.<boolean>}
     */
    beforeRender(viewFile, context, params) {
        var event = new ViewEvent({
            viewFile: viewFile,
            params: params
        });
        this.trigger(View.EVENT_BEFORE_RENDER, event);

        return Promise.resolve(event.isValid);
    }

    /**
     *
     * @param viewFile
     * @param context
     * @param params
     * @param output
     * @returns {Promise.<*>}
     */
    afterRender(viewFile, context, params, output) {
        if (this.hasEventHandlers(View.EVENT_AFTER_RENDER)) {
            var event = new ViewEvent({
                viewFile: viewFile,
                params: params,
                output: output
            });
            this.trigger(View.EVENT_AFTER_RENDER, event);
            output = event.output;
        }

        return Promise.resolve(output);
    }

}

View.RENDERER_UNDERSCORE = 'underscore';

View.RENDERER_REACT = 'react';
/**
         * @event ViewEvent an event that is triggered by [[renderFile()]] right after it renders a view file.
         */
View.EVENT_AFTER_RENDER = 'afterRender';

/**
         * @event ViewEvent an event that is triggered by [[renderFile()]] right before it renders a view file.
         */
View.EVENT_BEFORE_RENDER = 'beforeRender';
module.exports = View;