var Jii = require('../../index');
var UnitTest = require('../../base/UnitTest');
var UrlManager = require('../../request/UrlManager');
var UrlRule = require('../../request/UrlRule');
var HttpRequest = require('../../base/HttpRequest');
require('../bootstrap');
class UrlRuleTest extends UnitTest {

    createUrlTest(test) {
        var manager = new UrlManager({
            cache: null
        });
        var suites = this._getTestsForCreateUrl();
        suites.forEach(function(suite, i) {
            var name = suite[0];
            var config = suite[1];
            var tests = suite[2];

            var rule = new UrlRule(config);
            tests.forEach(function(urlTest, j) {
                var route = urlTest[0];
                var params = urlTest[1];
                var expected = urlTest[2];

                var url = rule.createUrl(manager, route, params);
                test.equal(url, expected, 'Test #' + i + '-' + j + ': ' + name);
            });
        });

        test.done();
    }

    parseRequestTest(test) {
        var manager = new UrlManager({
            cache: null
        });
        var request = new HttpRequest();
        request.setHostInfo('http://en.example.com');

        var suites = this._getTestsForParseRequest();
        suites.forEach(function(suite, i) {
            var name = suite[0];
            var config = suite[1];
            var tests = suite[2];

            var rule = new UrlRule(config);
            tests.forEach(function(urlTest, j) {
                request.setPathInfo(urlTest[0]);
                var route = urlTest[1];
                var params = urlTest[2] || {};

                var result = rule.parseRequest(manager, request);
                if (route === false) {
                    test.strictEqual(result, false, 'Test #' + i + '-' + j + ': ' + name);
                } else {
                    test.deepEqual(result, [
                        route,
                        params
                    ], 'Test #' + i + '-' + j + ': ' + name);
                }
            });
        });

        test.done();
    }

    _getTestsForCreateUrl() {
        // structure of each test
        //   message for the test
        //   config for the URL rule
        //   list of inputs and outputs
        //     route
        //     params
        //     expected output
        return [
            [
                'empty pattern',
                {
                    pattern: '',
                    route: 'post/index'
                },
                [
                    [
                        'post/index',
                        {},
                        ''
                    ],
                    [
                        'comment/index',
                        {},
                        false
                    ],
                    [
                        'post/index',
                        {
                            page: 1
                        },
                        '?page=1'
                    ]
                ]
            ],
            [
                'without param',
                {
                    pattern: 'posts',
                    route: 'post/index'
                },
                [
                    [
                        'post/index',
                        {},
                        'posts'
                    ],
                    [
                        'comment/index',
                        {},
                        false
                    ],
                    [
                        'post/index',
                        {
                            page: 1
                        },
                        'posts?page=1'
                    ]
                ]
            ],
            [
                'parsing only',
                {
                    pattern: 'posts',
                    route: 'post/index',
                    mode: UrlRule.PARSING_ONLY
                },
                [[
                    'post/index',
                    {},
                    false
                ]]
            ],
            [
                'with param',
                {
                    pattern: 'post/<page>',
                    route: 'post/index'
                },
                [
                    [
                        'post/index',
                        {},
                        false
                    ],
                    [
                        'comment/index',
                        {},
                        false
                    ],
                    [
                        'post/index',
                        {
                            page: 1
                        },
                        'post/1'
                    ],
                    [
                        'post/index',
                        {
                            page: 1,
                            tag: 'a'
                        },
                        'post/1?tag=a'
                    ]
                ]
            ],
            [
                'with param requirement',
                {
                    pattern: 'post/<page:\\d+>',
                    route: 'post/index'
                },
                [
                    [
                        'post/index',
                        {
                            page: 'abc'
                        },
                        false
                    ],
                    [
                        'post/index',
                        {
                            page: 1
                        },
                        'post/1'
                    ],
                    [
                        'post/index',
                        {
                            page: 1,
                            tag: 'a'
                        },
                        'post/1?tag=a'
                    ]
                ]
            ],
            [
                'with multiple params',
                {
                    pattern: 'post/<page:\\d+>-<tag>',
                    route: 'post/index'
                },
                [
                    [
                        'post/index',
                        {
                            page: '1abc'
                        },
                        false
                    ],
                    [
                        'post/index',
                        {
                            page: 1
                        },
                        false
                    ],
                    [
                        'post/index',
                        {
                            page: 1,
                            tag: 'a'
                        },
                        'post/1-a'
                    ]
                ]
            ],
            [
                'with optional param',
                {
                    pattern: 'post/<page:\\d+>/<tag>',
                    route: 'post/index',
                    defaults: {
                        page: 1
                    }
                },
                [
                    [
                        'post/index',
                        {
                            page: 1
                        },
                        false
                    ],
                    [
                        'post/index',
                        {
                            page: '1abc',
                            tag: 'a'
                        },
                        false
                    ],
                    [
                        'post/index',
                        {
                            page: 1,
                            tag: 'a'
                        },
                        'post/a'
                    ],
                    [
                        'post/index',
                        {
                            page: 2,
                            tag: 'a'
                        },
                        'post/2/a'
                    ]
                ]
            ],
            [
                'with optional param not in pattern',
                {
                    pattern: 'post/<tag>',
                    route: 'post/index',
                    defaults: {
                        page: 1
                    }
                },
                [
                    [
                        'post/index',
                        {
                            page: 1
                        },
                        false
                    ],
                    [
                        'post/index',
                        {
                            page: '1abc',
                            tag: 'a'
                        },
                        false
                    ],
                    [
                        'post/index',
                        {
                            page: 2,
                            tag: 'a'
                        },
                        false
                    ],
                    [
                        'post/index',
                        {
                            page: 1,
                            tag: 'a'
                        },
                        'post/a'
                    ]
                ]
            ],
            [
                'multiple optional params',
                {
                    pattern: 'post/<page:\\d+>/<tag>/<sort:yes|no>',
                    route: 'post/index',
                    defaults: {
                        page: 1,
                        sort: 'yes'
                    }
                },
                [
                    [
                        'post/index',
                        {
                            page: 1
                        },
                        false
                    ],
                    [
                        'post/index',
                        {
                            page: '1abc',
                            tag: 'a'
                        },
                        false
                    ],
                    [
                        'post/index',
                        {
                            page: 1,
                            tag: 'a',
                            sort: 'YES'
                        },
                        false
                    ],
                    [
                        'post/index',
                        {
                            page: 1,
                            tag: 'a',
                            sort: 'yes'
                        },
                        'post/a'
                    ],
                    [
                        'post/index',
                        {
                            page: 2,
                            tag: 'a',
                            sort: 'yes'
                        },
                        'post/2/a'
                    ],
                    [
                        'post/index',
                        {
                            page: 2,
                            tag: 'a',
                            sort: 'no'
                        },
                        'post/2/a/no'
                    ],
                    [
                        'post/index',
                        {
                            page: 1,
                            tag: 'a',
                            sort: 'no'
                        },
                        'post/a/no'
                    ]
                ]
            ],
            [
                'optional param and required param separated by dashes',
                {
                    pattern: 'post/<page:\\d+>-<tag>',
                    route: 'post/index',
                    defaults: {
                        page: 1
                    }
                },
                [
                    [
                        'post/index',
                        {
                            page: 1
                        },
                        false
                    ],
                    [
                        'post/index',
                        {
                            page: '1abc',
                            tag: 'a'
                        },
                        false
                    ],
                    [
                        'post/index',
                        {
                            page: 1,
                            tag: 'a'
                        },
                        'post/-a'
                    ],
                    [
                        'post/index',
                        {
                            page: 2,
                            tag: 'a'
                        },
                        'post/2-a'
                    ]
                ]
            ],
            [
                'optional param at the end',
                {
                    pattern: 'post/<tag>/<page:\\d+>',
                    route: 'post/index',
                    defaults: {
                        page: 1
                    }
                },
                [
                    [
                        'post/index',
                        {
                            page: 1
                        },
                        false
                    ],
                    [
                        'post/index',
                        {
                            page: '1abc',
                            tag: 'a'
                        },
                        false
                    ],
                    [
                        'post/index',
                        {
                            page: 1,
                            tag: 'a'
                        },
                        'post/a'
                    ],
                    [
                        'post/index',
                        {
                            page: 2,
                            tag: 'a'
                        },
                        'post/a/2'
                    ]
                ]
            ],
            [
                'consecutive optional params',
                {
                    pattern: 'post/<page:\\d+>/<tag>',
                    route: 'post/index',
                    defaults: {
                        page: 1,
                        tag: 'a'
                    }
                },
                [
                    [
                        'post/index',
                        {
                            page: 1
                        },
                        false
                    ],
                    [
                        'post/index',
                        {
                            page: '1abc',
                            tag: 'a'
                        },
                        false
                    ],
                    [
                        'post/index',
                        {
                            page: 1,
                            tag: 'a'
                        },
                        'post'
                    ],
                    [
                        'post/index',
                        {
                            page: 2,
                            tag: 'a'
                        },
                        'post/2'
                    ],
                    [
                        'post/index',
                        {
                            page: 1,
                            tag: 'b'
                        },
                        'post/b'
                    ],
                    [
                        'post/index',
                        {
                            page: 2,
                            tag: 'b'
                        },
                        'post/2/b'
                    ]
                ]
            ],
            [
                'consecutive optional params separated by dash',
                {
                    pattern: 'post/<page:\\d+>-<tag>',
                    route: 'post/index',
                    defaults: {
                        page: 1,
                        tag: 'a'
                    }
                },
                [
                    [
                        'post/index',
                        {
                            page: 1
                        },
                        false
                    ],
                    [
                        'post/index',
                        {
                            page: '1abc',
                            tag: 'a'
                        },
                        false
                    ],
                    [
                        'post/index',
                        {
                            page: 1,
                            tag: 'a'
                        },
                        'post/-'
                    ],
                    [
                        'post/index',
                        {
                            page: 1,
                            tag: 'b'
                        },
                        'post/-b'
                    ],
                    [
                        'post/index',
                        {
                            page: 2,
                            tag: 'a'
                        },
                        'post/2-'
                    ],
                    [
                        'post/index',
                        {
                            page: 2,
                            tag: 'b'
                        },
                        'post/2-b'
                    ]
                ]
            ],
            [
                'route has parameters',
                {
                    pattern: '<controller>/<action>',
                    route: '<controller>/<action>',
                    defaults: {}
                },
                [
                    [
                        'post/index',
                        {
                            page: 1
                        },
                        'post/index?page=1'
                    ],
                    [
                        'module/post/index',
                        {},
                        false
                    ]
                ]
            ],
            [
                'route has parameters with regex',
                {
                    pattern: '<controller:post|comment>/<action>',
                    route: '<controller>/<action>',
                    defaults: {}
                },
                [
                    [
                        'post/index',
                        {
                            page: 1
                        },
                        'post/index?page=1'
                    ],
                    [
                        'comment/index',
                        {
                            page: 1
                        },
                        'comment/index?page=1'
                    ],
                    [
                        'test/index',
                        {
                            page: 1
                        },
                        false
                    ],
                    [
                        'post',
                        {},
                        false
                    ],
                    [
                        'module/post/index',
                        {},
                        false
                    ],
                    [
                        'post/index',
                        {
                            controller: 'comment'
                        },
                        'post/index?controller=comment'
                    ]
                ]
            ],
            [
                'route has default parameter',
                {
                    pattern: '<controller:post|comment>/<action>',
                    route: '<controller>/<action>',
                    defaults: {
                        action: 'index'
                    }
                },
                [
                    [
                        'post/view',
                        {
                            page: 1
                        },
                        'post/view?page=1'
                    ],
                    [
                        'comment/view',
                        {
                            page: 1
                        },
                        'comment/view?page=1'
                    ],
                    [
                        'test/view',
                        {
                            page: 1
                        },
                        false
                    ],
                    [
                        'test/index',
                        {
                            page: 1
                        },
                        false
                    ],
                    [
                        'post/index',
                        {
                            page: 1
                        },
                        'post?page=1'
                    ]
                ]
            ],
            [
                'empty pattern with suffix',
                {
                    pattern: '',
                    route: 'post/index',
                    suffix: '.html'
                },
                [
                    [
                        'post/index',
                        {},
                        ''
                    ],
                    [
                        'comment/index',
                        {},
                        false
                    ],
                    [
                        'post/index',
                        {
                            page: 1
                        },
                        '?page=1'
                    ]
                ]
            ],
            [
                'regular pattern with suffix',
                {
                    pattern: 'posts',
                    route: 'post/index',
                    suffix: '.html'
                },
                [
                    [
                        'post/index',
                        {},
                        'posts.html'
                    ],
                    [
                        'comment/index',
                        {},
                        false
                    ],
                    [
                        'post/index',
                        {
                            page: 1
                        },
                        'posts.html?page=1'
                    ]
                ]
            ],
            [
                'empty pattern with slash suffix',
                {
                    pattern: '',
                    route: 'post/index',
                    suffix: '/'
                },
                [
                    [
                        'post/index',
                        {},
                        ''
                    ],
                    [
                        'comment/index',
                        {},
                        false
                    ],
                    [
                        'post/index',
                        {
                            page: 1
                        },
                        '?page=1'
                    ]
                ]
            ],
            [
                'regular pattern with slash suffix',
                {
                    pattern: 'posts',
                    route: 'post/index',
                    suffix: '/'
                },
                [
                    [
                        'post/index',
                        {},
                        'posts/'
                    ],
                    [
                        'comment/index',
                        {},
                        false
                    ],
                    [
                        'post/index',
                        {
                            page: 1
                        },
                        'posts/?page=1'
                    ]
                ]
            ],
            [
                'with host info',
                {
                    pattern: 'post/<page:\\d+>/<tag>',
                    route: 'post/index',
                    defaults: {
                        page: 1
                    },
                    host: 'http://<lang:en|fr>.example.com'
                },
                [
                    [
                        'post/index',
                        {
                            page: 1,
                            tag: 'a'
                        },
                        false
                    ],
                    [
                        'post/index',
                        {
                            page: 1,
                            tag: 'a',
                            lang: 'en'
                        },
                        'http://en.example.com/post/a'
                    ]
                ]
            ]
        ];
    }

    _getTestsForParseRequest() {
        // structure of each test
        //   message for the test
        //   config for the URL rule
        //   list of inputs and outputs
        //     pathInfo
        //     expected route, or false if the rule doesn't apply
        //     expected params, or not set if empty
        return [
            [
                'empty pattern',
                {
                    pattern: '',
                    route: 'post/index'
                },
                [
                    [
                        '',
                        'post/index'
                    ],
                    [
                        'a',
                        false
                    ]
                ]
            ],
            [
                'without param',
                {
                    pattern: 'posts',
                    route: 'post/index'
                },
                [
                    [
                        'posts',
                        'post/index'
                    ],
                    [
                        'a',
                        false
                    ]
                ]
            ],
            [
                'with dot',
                {
                    pattern: 'posts.html',
                    route: 'post/index'
                },
                [
                    [
                        'posts.html',
                        'post/index'
                    ],
                    [
                        'postsahtml',
                        false
                    ]
                ]
            ],
            [
                'creation only',
                {
                    pattern: 'posts',
                    route: 'post/index',
                    mode: UrlRule.CREATION_ONLY
                },
                [[
                    'posts',
                    false
                ]]
            ],
            [
                'with param',
                {
                    pattern: 'post/<page>',
                    route: 'post/index'
                },
                [
                    [
                        'post/1',
                        'post/index',
                        {
                            page: '1'
                        }
                    ],
                    [
                        'post/a',
                        'post/index',
                        {
                            page: 'a'
                        }
                    ],
                    [
                        'post',
                        false
                    ],
                    [
                        'posts',
                        false
                    ]
                ]
            ],
            [
                'with param requirement',
                {
                    pattern: 'post/<page:\\d+>',
                    route: 'post/index'
                },
                [
                    [
                        'post/1',
                        'post/index',
                        {
                            page: '1'
                        }
                    ],
                    [
                        'post/a',
                        false
                    ],
                    [
                        'post/1/a',
                        false
                    ]
                ]
            ],
            [
                'with multiple params',
                {
                    pattern: 'post/<page:\\d+>-<tag>',
                    route: 'post/index'
                },
                [
                    [
                        'post/1-a',
                        'post/index',
                        {
                            page: '1',
                            tag: 'a'
                        }
                    ],
                    [
                        'post/a',
                        false
                    ],
                    [
                        'post/1',
                        false
                    ],
                    [
                        'post/1/a',
                        false
                    ]
                ]
            ],
            [
                'with optional param',
                {
                    pattern: 'post/<page:\\d+>/<tag>',
                    route: 'post/index',
                    defaults: {
                        page: 1
                    }
                },
                [
                    [
                        'post/1/a',
                        'post/index',
                        {
                            page: '1',
                            tag: 'a'
                        }
                    ],
                    [
                        'post/2/a',
                        'post/index',
                        {
                            page: '2',
                            tag: 'a'
                        }
                    ],
                    [
                        'post/a',
                        'post/index',
                        {
                            page: '1',
                            tag: 'a'
                        }
                    ],
                    [
                        'post/1',
                        'post/index',
                        {
                            page: '1',
                            tag: '1'
                        }
                    ]
                ]
            ],
            [
                'with optional param not in pattern',
                {
                    pattern: 'post/<tag>',
                    route: 'post/index',
                    defaults: {
                        page: 1
                    }
                },
                [
                    [
                        'post/a',
                        'post/index',
                        {
                            page: '1',
                            tag: 'a'
                        }
                    ],
                    [
                        'post/1',
                        'post/index',
                        {
                            page: '1',
                            tag: '1'
                        }
                    ],
                    [
                        'post',
                        false
                    ]
                ]
            ],
            [
                'multiple optional params',
                {
                    pattern: 'post/<page:\\d+>/<tag>/<sort:yes|no>',
                    route: 'post/index',
                    defaults: {
                        page: 1,
                        sort: 'yes'
                    }
                },
                [
                    [
                        'post/1/a/yes',
                        'post/index',
                        {
                            page: '1',
                            tag: 'a',
                            sort: 'yes'
                        }
                    ],
                    [
                        'post/1/a/no',
                        'post/index',
                        {
                            page: '1',
                            tag: 'a',
                            sort: 'no'
                        }
                    ],
                    [
                        'post/2/a/no',
                        'post/index',
                        {
                            page: '2',
                            tag: 'a',
                            sort: 'no'
                        }
                    ],
                    [
                        'post/2/a',
                        'post/index',
                        {
                            page: '2',
                            tag: 'a',
                            sort: 'yes'
                        }
                    ],
                    [
                        'post/a/no',
                        'post/index',
                        {
                            page: '1',
                            tag: 'a',
                            sort: 'no'
                        }
                    ],
                    [
                        'post/a',
                        'post/index',
                        {
                            page: '1',
                            tag: 'a',
                            sort: 'yes'
                        }
                    ],
                    [
                        'post',
                        false
                    ]
                ]
            ],
            [
                'optional param and required param separated by dashes',
                {
                    pattern: 'post/<page:\\d+>-<tag>',
                    route: 'post/index',
                    defaults: {
                        page: 1
                    }
                },
                [
                    [
                        'post/1-a',
                        'post/index',
                        {
                            page: '1',
                            tag: 'a'
                        }
                    ],
                    [
                        'post/2-a',
                        'post/index',
                        {
                            page: '2',
                            tag: 'a'
                        }
                    ],
                    [
                        'post/-a',
                        'post/index',
                        {
                            page: '1',
                            tag: 'a'
                        }
                    ],
                    [
                        'post/a',
                        false
                    ],
                    [
                        'post-a',
                        false
                    ]
                ]
            ],
            [
                'optional param at the end',
                {
                    pattern: 'post/<tag>/<page:\\d+>',
                    route: 'post/index',
                    defaults: {
                        page: 1
                    }
                },
                [
                    [
                        'post/a/1',
                        'post/index',
                        {
                            page: '1',
                            tag: 'a'
                        }
                    ],
                    [
                        'post/a/2',
                        'post/index',
                        {
                            page: '2',
                            tag: 'a'
                        }
                    ],
                    [
                        'post/a',
                        'post/index',
                        {
                            page: '1',
                            tag: 'a'
                        }
                    ],
                    [
                        'post/2',
                        'post/index',
                        {
                            page: '1',
                            tag: '2'
                        }
                    ],
                    [
                        'post',
                        false
                    ]
                ]
            ],
            [
                'consecutive optional params',
                {
                    pattern: 'post/<page:\\d+>/<tag>',
                    route: 'post/index',
                    defaults: {
                        page: '1',
                        tag: 'a'
                    }
                },
                [
                    [
                        'post/2/b',
                        'post/index',
                        {
                            page: '2',
                            tag: 'b'
                        }
                    ],
                    [
                        'post/2',
                        'post/index',
                        {
                            page: '2',
                            tag: 'a'
                        }
                    ],
                    [
                        'post',
                        'post/index',
                        {
                            page: '1',
                            tag: 'a'
                        }
                    ],
                    [
                        'post/b',
                        'post/index',
                        {
                            page: '1',
                            tag: 'b'
                        }
                    ],
                    [
                        'post//b',
                        false
                    ]
                ]
            ],
            [
                'consecutive optional params separated by dash',
                {
                    pattern: 'post/<page:\\d+>-<tag>',
                    route: 'post/index',
                    defaults: {
                        page: 1,
                        tag: 'a'
                    }
                },
                [
                    [
                        'post/2-b',
                        'post/index',
                        {
                            page: '2',
                            tag: 'b'
                        }
                    ],
                    [
                        'post/2-',
                        'post/index',
                        {
                            page: '2',
                            tag: 'a'
                        }
                    ],
                    [
                        'post/-b',
                        'post/index',
                        {
                            page: '1',
                            tag: 'b'
                        }
                    ],
                    [
                        'post/-',
                        'post/index',
                        {
                            page: '1',
                            tag: 'a'
                        }
                    ],
                    [
                        'post',
                        false
                    ]
                ]
            ],
            [
                'route has parameters',
                {
                    pattern: '<controller>/<action>',
                    route: '<controller>/<action>',
                    defaults: {}
                },
                [
                    [
                        'post/index',
                        'post/index'
                    ],
                    [
                        'module/post/index',
                        false
                    ]
                ]
            ],
            [
                'route has parameters with regex',
                {
                    pattern: '<controller:post|comment>/<action>',
                    route: '<controller>/<action>',
                    defaults: {}
                },
                [
                    [
                        'post/index',
                        'post/index'
                    ],
                    [
                        'comment/index',
                        'comment/index'
                    ],
                    [
                        'test/index',
                        false
                    ],
                    [
                        'post',
                        false
                    ],
                    [
                        'module/post/index',
                        false
                    ]
                ]
            ],
            [
                'route has default parameter',
                {
                    pattern: '<controller:post|comment>/<action>',
                    route: '<controller>/<action>',
                    defaults: {
                        action: 'index'
                    }
                },
                [
                    [
                        'post/view',
                        'post/view'
                    ],
                    [
                        'comment/view',
                        'comment/view'
                    ],
                    [
                        'test/view',
                        false
                    ],
                    [
                        'post',
                        'post/index'
                    ],
                    [
                        'posts',
                        false
                    ],
                    [
                        'test',
                        false
                    ],
                    [
                        'index',
                        false
                    ]
                ]
            ],
            [
                'empty pattern with suffix',
                {
                    pattern: '',
                    route: 'post/index',
                    suffix: '.html'
                },
                [
                    [
                        '',
                        'post/index'
                    ],
                    [
                        '.html',
                        false
                    ],
                    [
                        'a.html',
                        false
                    ]
                ]
            ],
            [
                'regular pattern with suffix',
                {
                    pattern: 'posts',
                    route: 'post/index',
                    suffix: '.html'
                },
                [
                    [
                        'posts.html',
                        'post/index'
                    ],
                    [
                        'posts',
                        false
                    ],
                    [
                        'posts.HTML',
                        false
                    ],
                    [
                        'a.html',
                        false
                    ],
                    [
                        'a',
                        false
                    ]
                ]
            ],
            [
                'empty pattern with slash suffix',
                {
                    pattern: '',
                    route: 'post/index',
                    suffix: '/'
                },
                [
                    [
                        '',
                        'post/index'
                    ],
                    [
                        'a',
                        false
                    ]
                ]
            ],
            [
                'regular pattern with slash suffix',
                {
                    pattern: 'posts',
                    route: 'post/index',
                    suffix: '/'
                },
                [
                    [
                        'posts/',
                        'post/index'
                    ],
                    [
                        'posts',
                        false
                    ],
                    [
                        'a',
                        false
                    ]
                ]
            ],
            [
                'with host info',
                {
                    pattern: 'post/<page:\\d+>',
                    route: 'post/index',
                    host: 'http://<lang:en|fr>.example.com'
                },
                [
                    [
                        'post/1',
                        'post/index',
                        {
                            page: '1',
                            lang: 'en'
                        }
                    ],
                    [
                        'post/a',
                        false
                    ],
                    [
                        'post/1/a',
                        false
                    ]
                ]
            ]
        ];
    }

}
module.exports = new UrlRuleTest().exports();