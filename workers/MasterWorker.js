/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

var Jii = require('../index');
var _isNumber = require('lodash/isNumber');
var _each = require('lodash/each');
var _has = require('lodash/has');
var _size = require('lodash/size');
var BaseObject = require('../base/BaseObject');
var cluster = require('cluster');

class MasterWorker extends BaseObject {

    preInit() {
        /**
         * @type {boolean}
         */
        this._isMasterKilled = false;

        /**
         * @type {object}
         */
        this._indexes = {};

        /**
         * @type {object}
         */
        this._workers = {};

        /**
         * HH:MM format, Example: 05:00
         * Set `false` for disable
         * @type {boolean|string}
         */
        this.autoRestartTime = false;

        super.preInit(...arguments);
    }

    init() {
        console.info('Start master (pid %s)...', process.pid);

        // Subscribe on shutdown event
        process.on('SIGTERM', this._onMasterExit.bind(this));

        // Wrap errors, do not exit master
        process.on('uncaughtException', err => {
            console.error('Caught exception in master:', err, err.stack);
        });
    }

    /**
     *
     * @param {string} name
     */
    fork(name) {
        if (this._isMasterKilled) {
            return;
        }

        var index = this._reserveIndex(name);
        var worker = cluster.fork({
            JII_APPLICATION_NAME: name,
            JII_WORKER_INDEX: index
        });
        if (!worker) {
            console.info('Worker can not started (application id `%s`).', name);
            return;
        }

        console.info('Run worker: pid `%s`, application id `%s` (index %s).', worker.process.pid, name, index);

        var pid = worker.process.pid;
        worker.on('exit', (code, signal) => {
            this._onChildExit(pid, code, signal);
        });

        // Push message to all workers
        worker.on('message', data => {
            _each(this._workers, workerInfo => {
                if (!workerInfo) {
                    return;
                }

                if (data.filter && _has(data.filter, 'index') && data.filter.index != workerInfo.index) {
                    return;
                }

                data.workersCount = _size(this._workers);
                workerInfo.worker.send(data);
            });
        });

        this._autoRestart(worker);

        this._workers[pid] = {
            name: name,
            index: index,
            worker: worker
        };
        this._indexes[name][pid] = index;
    }

    /**
     *
     * @private
     */
    _autoRestart(worker) {
        if (!this.autoRestartTime) {
            return;
        }

        var parts = this.autoRestartTime.split(':');
        var hour = parseInt(parts[0]);
        var minute = parseInt(parts[1] || '0');
        if (!_isNumber(hour) || !_isNumber(minute)) {
            console.error('Wrong autoRestart time format (Need: HH:MM):', this.autoRestartTime);
            return;
        }

        // kill by time
        var now = new Date();
        var pid = worker.process.pid;
        var nextTime = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, hour, minute, 0, 0).getTime();
        var killTime = nextTime - new Date().getTime() + Math.floor(Math.random() * 1800000);
        // + scatter in 30 mins
        var timerId = setTimeout(() => {
            process.kill(pid);
            console.log('KILL TIME!!!', killTime);
        }, killTime);

        worker.on('exit', () => {
            clearInterval(timerId);
        });
    }

    _reserveIndex(name) {
        this._indexes[name] = this._indexes[name] || {};

        var index = 0;
        var reserved = this._indexes[name];

        while (true) {
            // Find index for check already used
            var isUsed = false;
            for (var id in reserved) {
                if (reserved.hasOwnProperty(id) && reserved[id] === index) {
                    isUsed = true;
                    break;
                }
            }

            if (!isUsed) {
                return index;
            }
            index++;
        }
    }

    _onChildExit(pid, code, signal) {
        if (signal) {
            console.warn('Worker `%s` was killed by signal `%s`.', pid, signal);
        } else if (code) {
            console.error('worker `%s` exited with error code: `%s`.', pid, code);
        } else {
            console.log('worker was success exit!');
        }

        if (this._workers[pid]) {
            var name = this._workers[pid].name;

            // Clean
            this._indexes[name][pid] = null;
            this._workers[pid] = null;

            // Start another worker
            this.fork(name);
        }
    }

    _onMasterExit() {
        this._isMasterKilled = true;
        console.log('Received SIGTERM event. Terminating all worker threads and self.');

        // Kill child
        _each(this._workers, worker => {
            process.kill(worker.process.pid);
        });

        // Kill self
        process.exit(0);
    }

}
module.exports = MasterWorker;