module.exports = {

    environment: 'development',

    base: {
        application: { // Jii.application.WebApplication config
            components: {
                db: {
                    password: 'qweqwe'
                }
            }
        }
    },

    comet: { // app name
        workers: 3
    }

}