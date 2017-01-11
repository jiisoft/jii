'use strict';

const _upperFirst = require('lodash/upperFirst');

class Inflector{
    
    /**
     * Converts a CamelCase name into space-separated words.
     * For example, 'PostTag' will be converted to 'Post Tag'.
     * @param {string} name the string to be converted
     * @param {boolean} ucwords whether to capitalize the first letter in each word
     * @return string the resulting words
     */
    static camel2words(name, ucwords = true)
    {
        const label = name.replace('(?<![A-Z])[A-Z]', ' \0').replace('-|_|\.', ' ').toLowerCase().trim();
    
        return ucwords ? label.split(' ').map(s => _upperFirst(s)).join(' ') : label;
    }
}
module.exports = Inflector;