'use strict';

var Jii = require('../../index');
var Console = require('../../helpers/Console');
var Controller = require('../Controller');
var fs = require('fs');
class ServiceController extends Controller {

    preInit() {
        this._forever = null;
        super.preInit(...arguments);
    }

    init() {
        super.init();
        this._forever = require('forever');
    }

    /**
     *
     * @param {object} context
     */
    actionIndex(context) {
        this.stdout('Welcome to Jii version ' + Jii.getVersion() + '.\nUse next instruction for install application as service:\n\n');
        this.stdout('Install\n', Console.BOLD);
        this.stdout('  Append script file `node-myapp` in /etc/init.d with script:\n');
        this.stdout('    node ' + process.argv[1] + ' service/$1 &\n', Console.FG_YELLOW);
        this.stdout('  Run service:\n');
        this.stdout('    /etc/init.d/node-myapp service/start\n\n', Console.FG_YELLOW);
        this.stdout('Start as service without install\n', Console.BOLD);
        this.stdout('  Run index.js file with argument `service/start`, `service/stop` or `service/restart`:\n');
        this.stdout('    node jii service/start\n\n', Console.FG_YELLOW);
    }

    /**
     *
     * @param {object} context
     */
    actionStart(context) {
        var runtimePath = Jii.app.getRuntimePath();
        if (!fs.existsSync(runtimePath)) {
            fs.mkdirSync(runtimePath);
        }

        var pidPath = runtimePath + '/node.pid';
        if (!fs.existsSync(pidPath)) {
            fs.appendFile(pidPath, '');
        }

        var logPath = runtimePath + '/node.log';
        if (!fs.existsSync(logPath)) {
            fs.appendFile(logPath, '');
        }

        var options = {
            append: true,
            silent: true,
            minUptime: 5000,
            spinSleepTime: 2000,
            pidFile: pidPath,
            logFile: logPath,
            outFile: logPath
        };

        //var realPath = require('fs').realpathSync(script);
        //var cwd = script.indexOf('/') === 0 ? script.replace(/[^\/]$/, '') : process.cwd();
        /*var options = [ { script: 'index.js',
         args: [],
         pidFile: undefined,
         logFile: undefined,
         errFile: undefined,
         watch: false,
         minUptime: 1000,
         append: false,
         silent: false,
         outFile: undefined,
         max: undefined,
         command: undefined,
         path: undefined,
         spinSleepTime: undefined,
         sourceDir: '/Users/affka/Documents/projects/jii/node_modules/jiiframework.ru',
         workingDir: '/Users/affka/Documents/projects/jii/node_modules/jiiframework.ru',
         uid: undefined,
         watchDirectory: undefined,
         watchIgnore: [],
         killTree: false,
         killSignal: undefined,
         id: undefined,
         watchIgnorePatterns: [],
         spawnWith: { cwd: '/Users/affka/Documents/projects/jii/node_modules/jiiframework.ru' } } ];*/

        var monitor = this._forever.start(this._getScriptFile(), options);
        monitor.on('start', () => {
            this._forever.startServer(monitor);
        });
    }

    /**
     *
     * @param {object} context
     */
    actionRestart(context) {
        this._forever.cli.restart(this._getScriptFile());
    }

    /**
     *
     * @param {object} context
     */
    actionStop(context) {
        this._forever.cli.stop(this._getScriptFile());
    }

    /**
     *
     * @param {object} context
     */
    actionStatus(context) {
        this._forever.cli.list();
    }

    _getScriptFile() {
        return process.argv[1];
    }

}
module.exports = ServiceController;