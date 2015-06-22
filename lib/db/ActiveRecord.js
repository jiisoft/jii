/**
 * @author Harutyun Abgaryan <harutyunabgaryan@gmail.com>
 * @license MIT
 */

'use strict';

/**
 * @namespace Jii
 * @ignore
 */
var Jii = require('../Jii');


/**
 * @class Jii.db.ActiveRecord
 * @extends Jii.db.BaseActiveRecord
 */


Jii.defineClass('Jii.db.ActiveRecord', {


    __extends: Jii.db.BaseActiveRecord,

    DB: Jii.db.BaseActiveRecord.init(),


})