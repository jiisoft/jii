/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */
'use strict';

var Jii = require('../BaseJii');
var _isString = require('lodash/isString');
var _each = require('lodash/each');
var Object = require('../base/Object');
var fs = require('fs');
class ClassLoader extends Object {

    static packages() {
        _each(this.constructor.classesMap, (classNames, packageName) => {
            if (packageName !== 'jii') {
                try {
                    require.resolve(packageName);
                } catch (e) {
                    return;
                }
                require(packageName);
            }
        });
    }

    static load(name) {
        if (!name || !_isString(name)) {
            return;
        }

        if (this._loaded[name]) {
            return;
        }
        this._loaded[name] = true;

        if (name.indexOf('Jii.') === 0) {
            _each(this.constructor.classesMap, (classNames, packageName) => {
                _each(classNames, (className, path) => {
                    if (!name || className !== name) {
                        return;
                    }

                    require(packageName + '/' + path);
                });
            });
        } else if (name.indexOf(this.constructor.APP_NAMESPACE + '.') === 0) {
            var basePath = Jii.app && Jii.app.getBasePath() || process.cwd();
            var filePath = name.substr((this.constructor.APP_NAMESPACE + '.').length).replace(/\./, '/') + '.js';

            // Find file path
            var path = null;
            if (fs.existsSync(basePath + '/' + filePath)) {
                path = basePath + '/' + filePath;
            } else if (fs.existsSync(basePath + '/server/' + filePath)) {
                path = basePath + '/server/' + filePath;
            }

            if (path) {
                require(path);
            }
        }
    }

    static getClassPath(name) {
        var finedPath = null;
        if (name.indexOf('Jii.') === 0) {
            _each(this.constructor.classesMap, (classNames, packageName) => {
                _each(classNames, (className, path) => {
                    if (!name || className !== name) {
                        return;
                    }

                    finedPath = require.resolve(packageName + '/' + path);
                });
            });
        }
        return finedPath;
    }

}

ClassLoader._loaded = {};

ClassLoader.APP_NAMESPACE = 'app';

ClassLoader.classesMap = require('../classes.json');
module.exports = ClassLoader;