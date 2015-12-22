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
app.models.Cat = function(name, color) {
    // Short extend
    app.models.Animal.prototype.constructor.call(this, name)

    this._color = color;
}

// Short extend
var a = function() {};a.prototype = app.models.Animal.prototype;
app.models.Cat.prototype = new a();

app.models.Cat.prototype.getColor = function() {
    return this._color;
}