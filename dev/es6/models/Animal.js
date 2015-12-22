'use strict';

/**
 * @namespace app.models
 */
app.models = app.models || {};

/**
 * @class app.models.Animal
 */
app.models.Animal = class /** @lends app.models.Animal.prototype */{

    static food() {
        return ['meat'];
    }

    constructor(name) {
        this._name = name;
    }

    get name() {
        return this._name;
    }

    say() {
        console.log(this.name + ', go eat: ' + this.constructor.food().join(', '));
    }

}