'use strict';

var Jii = require('../../index');
var UnitTest = require('../../base/UnitTest');

/**
 * @class tests.unit.MergeConfigTest
 * @extends Jii.base.UnitTest
 */
var self = Jii.defineClass('tests.unit.MergeConfigTest', {

	__extends: UnitTest,

    mergeTest: function (test) {
        var o1 = {
            a: '1',
            b: [1, 2],
            c: {
                d: 'q',
                e: {
                    r: 't'
                }
            }
        };
        var o2 = {
            b: [3, 4],
            c: {
                d: {
                    y: 'u'
                },
                e: '555'
            }
        };
        var o3 = {
            z: 'e',
            c: {
                d: {
                    h: 'j'
                }
            }
        };

        test.deepEqual(Jii.mergeConfigs(o1, o2, o3), {
            a: '1',
            b: [3, 4],
            c: {
                d: {
                    y: 'u',
                    h: 'j'
                },
                e: '555'
            },
            z: 'e'
        });
        
        test.done();
    }

});

module.exports = new self().exports();
