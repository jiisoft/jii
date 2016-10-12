/**
 * @author Ihor Skliar
 * @license MIT
 */

var Jii = require('../index');
var BaseResponse = require('../base/Response');

/**
 * @class Jii.console.Response
 * @extends Jii.base.Response
 */
var Response = Jii.defineClass('Jii.console.Response', {

	__extends: BaseResponse,
    
    /**
     * The status 0 means the program terminates successfully.
     * @type {number} the exit status. Exit statuses should be in the range 0 to 254.
     */
    exitStatus: 0

});

module.exports = Response;