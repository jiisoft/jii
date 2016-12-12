/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */
'use strict';

var Jii = require('../BaseJii');
var _trimEnd = require('lodash/trimEnd');
var _each = require('lodash/each');
var Object = require('../base/Object');
class File extends Object {

    static getFileDirectory(path) {
        return path.replace(/\/?[^\/]+$/, '');
    }

    static getFileName(path) {
        return path.replace(/(.*\/)?([^\/]+)$/, '$2');
    }

    static getFileExtension(path) {
        var matches = /\.([a-z]+)$/.exec(path);
        return matches !== null ? matches[1] : '';
    }

    static isFile(path) {
        return path.match(/[^\/]+\.[^\/]+$/) !== null;
    }

    /**
         * Normalizes a file/directory path.
         * The normalization does the following work:
         *
         * - Convert all directory separators into `DIRECTORY_SEPARATOR` (e.g. "\a/b\c" becomes "/a/b/c")
         * - Remove trailing directory separators (e.g. "/a/b/c/" becomes "/a/b/c")
         * - Turn multiple consecutive slashes into a single one (e.g. "/a///b/c" becomes "/a/b/c")
         * - Remove ".." and "." based on their meanings (e.g. "/a/./b/../c" becomes "/a/c")
         *
         * @param {string} path the file/directory path to be normalized
         * @param {string} [ds] the directory separator to be used in the normalized result. Defaults to `DIRECTORY_SEPARATOR`.
         * @returns {string} the normalized file/directory path
         */
    static normalizePath(path, ds) {
        ds = ds || '/';

        path = _trimEnd(path.replace(/\/\\/g, ds + ds), ds);
        if ((ds + path).indexOf(ds + '.') === -1 && path.indexOf(ds + ds) === -1) {
            return path;
        }

        // the path may contain ".", ".." or double slashes, need to clean them up
        var parts = [];
        _each(path.split(ds), part => {
            if (part === '..' && parts.length > 0 && parts[parts.length - 1] !== '..') {
                parts.pop();
            }
            if (part === '.' || part === '' && parts.length > 0) {
                return;
            }

            parts.push(part);
        });

        path = parts.join(ds);
        return path === '' ? '.' : path;
    }

}

/**
         * @type {string} the path (or alias) of a PHP file containing MIME type information.
         */
File.mimeMagicFile = '@jii/helpers/mimeTypes.php';
File.PATTERN_CASE_INSENSITIVE = 32;
File.PATTERN_NEGATIVE = 16;
File.PATTERN_MUSTBEDIR = 8;
File.PATTERN_ENDSWITH = 4;

File.PATTERN_NODIR = 1;
module.exports = File;