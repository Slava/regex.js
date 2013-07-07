var Regex = require('./regex.js');
var r = new Regex('asdf|fads');
console.log(r.match('asdf') ? 'OK' : 'WA');
console.log(r.match('fads') ? 'OK' : 'WA');
console.log(r.match(!'asd') ? 'OK' : 'WA');
console.log(r.match(!'asdfg') ? 'OK' : 'WA');

