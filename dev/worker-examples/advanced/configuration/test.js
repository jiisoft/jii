module.exports = {
    application: {
        components: {
            appServerRequest: {
                className: 'watch.components.PhpConsoleRequest'
            }
        },
        modules: {
            ers: {
                enable: false
            },
            statistics: {
                enable: false
            }
        },
        params: {
            filesBaseUrl: 'http://nodeunit.test/files'
        }
    }
};