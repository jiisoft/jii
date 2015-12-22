'use strict';

global.app = {};

require('./models/Animal');
require('./models/Dog');
require('./models/Cat');

var dog = new app.models.Dog('Cooper', 3); // ok, class Dog found

console.log(dog._name); // ok, private name found

dog.say(); // IDE not found prototype methods
dog.age; // IDE not found prototype methods

app.models.Dog.food(); // IDE not found static methods

// Try extend without "class .. extends .."
var cat = new app.models.Cat('Barsik', 'orange'); // TypeError: Class constructors cannot be invoked without 'new'