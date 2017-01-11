'use strict';

const Jii = require('../../index');
const UnitTest = require('../../base/UnitTest');
class self extends UnitTest {

    mergeTest(test) {
        var o1 = {
            a: '1',
            b: [
                1,
                2
            ],
            c: {
                d: 'q',
                e: {
                    r: 't'
                }
            }
        };
        var o2 = {
            b: [
                3,
                4
            ],
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
            b: [
                3,
                4
            ],
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

}
module.exports = new self().exports();