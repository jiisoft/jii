module.exports = {
    application: {
        components: {
            logger: {
                level: 'info'
            },
            db: {
                username: 'example-s',
                database: 'example-p'
            }
        },
        modules: {
            statistics: {
                components: {
                    db: {
                        username: 'example-s',
                        database: 'example-p_stats'
                    }
                }
            }
        }
    }
};