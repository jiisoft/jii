/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */

'use strict';

var Jii = require('../../BaseJii');
var File = require('../../helpers/File');
var Controller = require('../../base/Controller');
var InvalidParamException = require('../../exceptions/InvalidParamException');
var ApplicationException = require('../../exceptions/ApplicationException');
var InvalidCallException = require('../../exceptions/InvalidCallException');
var _trimStart = require('lodash/trimStart');
var _isObject = require('lodash/isObject');
var _isFunction = require('lodash/isFunction');
var _template = require('lodash/template');
var IRenderer = require('../IRenderer');

/**
 * ViewEvent represents events triggered by the [[View]] component.
 *
 * @class Jii.view.underscore.UnderscoreRenderer
 * @extends Jii.view.IRenderer
 */
var UnderscoreRenderer = Jii.defineClass('Jii.view.underscore.UnderscoreRenderer', /** @lends Jii.view.underscore.UnderscoreRenderer.prototype */{

    __extends: IRenderer,

    /**
     * @type {string} the default view file extension. This will be appended to view file names if they don't have file extensions.
     */
    defaultExtension: '',

    /**
     * @type {object}
     */
    _templates: {},

    /**
     * @type {[]} the view files currently being rendered. There may be multiple view files being
     * rendered at a moment because one view may be rendered within another.
     */
    _viewFiles: [],
    _currentWebView: null,

    /**
     *
     * @param {*} view
     * @param {Jii.base.Context} context
     * @param {object} params
     * @param {Jii.base.Controller} controller
     * @param {Jii.view.WebView} webView
     * @returns {*}
     */
    render(view, context, params, controller, webView) {
        var viewFile = this._findViewFile(view, controller);
        return this.renderFile(viewFile, context, params, controller, webView);
    },

    /**
     *
     * @param {*} view
     * @param {Jii.base.Context} context
     * @param {object} params
     * @param {Jii.base.Controller} controller
     * @param {Jii.view.WebView} webView
     * @returns {*}
     */
    renderLayout(view, context, params, controller, webView) {
        return this.renderFile(view, context, params, controller, webView);
    },

    /**
     *
     * @param viewFile
     * @param context
     * @param params
     * @param controller
     * @param webView
     * @returns {*}
     */
    renderFile(viewFile, context, params, controller, webView) {
        params = params || {};
        webView = webView || this._currentWebView;

        viewFile = Jii.getAlias(viewFile);

        if (this.hasTemplate(viewFile)) {
            viewFile = this._localize(viewFile);
        } else {
            throw new InvalidParamException('The view file does not exist: ' + viewFile);
        }

        //Jii.trace('Rendering view file: ' + viewFile);

        // Append content to params
        params.context = context;

        this._viewFiles.push(viewFile);
        this._currentWebView = webView;
        var output = this.renderJsFile(viewFile, params, webView);
        this._viewFiles.pop();
        this._currentWebView = null;
        return output;
    },

    renderJsFile(file, params, webView) {
        params = params || {};

        if (!this._templates[file]) {
            throw new ApplicationException('Not found template in path `' + file + '`.');
        }

        params.Jii = Jii;
        return this._templates[file].call(webView, params);
    },

    getTemplate(path) {
        if (!require('fs').existsSync(path)) {
            return null;
        }
        this._templates[path] = _template(require('fs').readFileSync(path).toString());
        return this._templates[path] || null;
    },

    hasTemplate(path) {
        return this.getTemplate(path) !== null;
    },

    /**
     * @returns {string|boolean} the view file currently being rendered. False if no view file is being rendered.
     */
    getViewFile() {
        return this._viewFiles[this._viewFiles.length - 1];
    },

    /**
     * Finds the view file based on the given view name.
     * @param {string} view the view name or the path alias of the view file. Please refer to [[render()]]
     * on how to specify this parameter.
     * @param {object} context the context to be assigned to the view and can later be accessed via [[context]]
     * in the view. If the context implements [[ViewContextInterface]], it may also be used to locate
     * the view file corresponding to a relative view name.
     * @returns {string} the view file path. Note that the file may not exist.
     * @throws InvalidCallException if a relative view name is given while there is no active context to
     * determine the corresponding view file.
     */
    _findViewFile(view, context) {
        context = context || null;

        var file = null;

        if (view.substr(0, 1) === '@') {
            // e.g. "@app/views/main"
            file = Jii.getAlias(view);
        } else if (view.substr(0, 2) === '//') {
            // e.g. "//layouts/main"
            file = Jii.app.getViewPath() + '/' + _ltrim(view, '/');
        } else if (view.substr(0, 1) === '/') {
            // e.g. "/site/index"
            if (context instanceof Controller) {
                file = context.module.getViewPath() + '/' + _trimStart(view, '/');
            }
        } else if (_isObject(context) && _isFunction(context.getViewPath)) {
            file = context.getViewPath() + '/' + view;
        } else {
            var currentViewFile = this.getViewFile();
            if (currentViewFile !== false) {
                file = File.getFileDirectory(currentViewFile) + '/' + view;
            }
        }

        if (file === null) {
            throw new InvalidCallException('Unable to resolve view file for view ' + view + ': no active view context.');
        }

        if (File.getFileExtension(file) !== '') {
            return file;
        }

        var path = file + '.' + this.defaultExtension;
        if (this.defaultExtension !== 'ejs' && !File.getFileExtension(path)) {
            path = file + '.ejs';
        }

        return path;
    },

    /**
     * Returns the localized version of a specified file.
     *
     * The searching is based on the specified language code. In particular,
     * a file with the same name will be looked for under the subdirectory
     * whose name is the same as the language code. For example, given the file "path/to/view.php"
     * and language code "zh-CN", the localized file will be looked for as
     * "path/to/zh-CN/view.php". If the file is not found, it will try a fallback with just a language code that is
     * "zh" i.e. "path/to/zh/view.php". If it is not found as well the original file will be returned.
     *
     * If the target and the source language codes are the same,
     * the original file will be returned.
     *
     * @param {string} file the original file
     * @param {string} [language] the target language that the file should be localized to.
     * If not set, the value of [[\jii\base\Application.language]] will be used.
     * @param {string} [sourceLanguage] the language that the original file is in.
     * If not set, the value of [[\jii\base\Application.sourceLanguage]] will be used.
     * @returns {string} the matching localized file, or the original file if the localized version is not found.
     * If the target and the source language codes are the same, the original file will be returned.
     */
    _localize(file, language, sourceLanguage) {
        language = language || null;
        sourceLanguage = sourceLanguage || null;

        if (language === null) {
            language = Jii.app.language;
        }
        if (sourceLanguage === null) {
            sourceLanguage = Jii.app.sourceLanguage;
        }
        if (language === sourceLanguage) {
            return file;
        }

        var desiredFile = File.getFileDirectory(file) + '/' + language + '/' + File.getFileName(file);
        if (this.hasTemplate(desiredFile)) {
            return desiredFile;
        }

        language = language.substr(0, 2);
        if (language === sourceLanguage) {
            return file;
        }

        desiredFile = File.getFileDirectory(file) + '/' + language + '/' + File.getFileName(file);
        return this.hasTemplate(desiredFile) ? desiredFile : file;
    }

});

module.exports = UnderscoreRenderer;