/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

/**
 * @namespace Jii
 * @ignore
 */
var Jii = require('../../Jii');

var fs = require('fs');

/**
 * @class Jii.helpers.ClassLoader
 * @extends Jii.base.Object
 */
Jii.defineClass('Jii.helpers.ClassLoader', /** @lends Jii.helpers.ClassLoader.prototype */{

	__extends: 'Jii.base.Object',

	__static: /** @lends Jii.helpers.ClassLoader */{

        classesMap: require('../../../classes.json'),

        APP_NAMESPACE: 'app',

        _loaded: {},

        packages: function() {
            Jii._.each(this.__static.classesMap, function(classNames, packageName) {
                if (packageName !== 'jii') {
                    require(packageName);
                }
            });
        },

        load: function(name) {
            if (!name || !Jii._.isString(name)) {
                return;
            }

            if (this._loaded[name]) {
                return;
            }
            this._loaded[name] = true;

            if (name.indexOf('Jii.') === 0) {
                Jii._.each(this.__static.classesMap, function(classNames, packageName) {
                    Jii._.each(classNames, function(className, path) {
                        if (!name || className !== name) {
                            return;
                        }

                        require(packageName + '/' + path);
                    });
                });
            } else if (name.indexOf(this.__static.APP_NAMESPACE + '.') === 0) {
                var basePath = Jii.app && Jii.app.getBasePath() || process.cwd();
                var filePath = name.substr((this.__static.APP_NAMESPACE + '.').length).replace(/\./, '/') + '.js';

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

	}

});