'use strict';

require('./Animal');

/**
 * @namespace app.models
 */
app.models = app.models || {};

/**
 * @class app.models.Dog
 * @extends app.models.Animal
 */
app.models.Dog = class extends app.models.Animal /** @lends app.models.Dog.prototype */{

    static food() {
        return super.food().concat('bone');
    }

    constructor(name, age) {
        super(name);
        this._age = age;
    }

    get age() {
        return this._age;
    }

}