var assert = require('assert');
var _ = require('underscore');

var Regex = require('./regex.js');

suite('String matching', function () {
  var r = new Regex('magicalstring');
  test('String matches', function () {
    assert(r.match('magicalstring'));
  });
  test('Prefix matches but not whole string', function () {
    assert(!r.match('magic'));
  });
  test('Suffix matches but not whole string', function () {
    assert(!r.match('string'));
  });
  test('No match', function () {
    assert(!r.match('wrongstring'));
  });
});

suite('Grouping', function () {
  test('Just grouping shouldn\'t affect anything', function () {
    var r = new Regex('(somestring)');
    assert(r.match('somestring'));
  });

  test('Just grouping around concatenated groups', function () {
    var r = new Regex('((some)|(any))thing');
    assert(r.match('something'));
    assert(r.match('anything'));
  });

  test('Nest grouping', function () {
    var r = new Regex('(((((yahoo)))))');
    assert(r.match('yahoo'));
  });
});

suite('Alternation tests', function () {
  var r = new Regex('first|second|third|fi');
  test('Match one of alternations: ', function () {
    _.each(['first', 'second', 'third', 'fi'], function (string) {
      assert(r.match(string));
    });
  });

  test('No match for substring of one', function () {
    assert(!r.match('fir'));
    assert(!r.match('firs'));
    assert(!r.match('irs'));
  });
});

suite('Match any character - . (dot)', function () {
  var r = new Regex('ItIs....');
  test('Match of different variations', function () {
    assert(r.match('ItIsGood'));
    assert(r.match('ItIsBadd'));
    assert(r.match('ItIsxxxx'));
    assert(r.match('ItIs12O4'));
  });

  test('No match with wrong strings', function () {
    assert(!r.match('itIsGood'));
    assert(!r.match('ItIsGoodx'));
    assert(!r.match('ItIsGoo'));
  });
});

suite('Optional char - ?', function () {
  var r = new Regex('An?t');

  test('Using this char matches', function () {
    assert(r.match('Ant'));
  });
  test('Not using this char matches', function () {
    assert(r.match('At'));
  });
  test('More or wrong chars at this place doesn\'t match', function () {
    assert(!r.match('Abt'));
    assert(!r.match('Annt'));
    assert(!r.match('Anttt'));
  });

  test('Optional any character .?', function () {
    var r = new Regex('x.?z');
    assert(r.match('xyz'));
    assert(r.match('xz'));
  });

  test('Optional works on groups', function () {
    var r = new Regex('(pre)?fix');
    assert(r.match('prefix'));
    assert(r.match('fix'));
    assert(!r.match('suffix'));
  });
});

suite('One or more operator - + (plus)', function () {
  test('Use plus!', function () {
    var r = new Regex('Ja+ck');
    assert(r.match('Jack'));
    assert(r.match('Jaack'));
    assert(r.match('Jaaack'));
    assert(!r.match('Jck'));
  });

  test('Plus on group works', function () {
    var r = new Regex('Na(Na)+Batman');
    assert(r.match('NaNaBatman'));
    assert(r.match('NaNaNaBatman'));
    assert(r.match('NaNaNaNaBatman'));
    assert(!r.match('NaBatman'));
  });

  test('Regex meaning nonempty string', function () {
    var r = new Regex('.+');
    assert(r.match('abracadabra'));
    assert(r.match('diehard'));
    assert(r.match('50shadesOfGrey'));
    assert(!r.match(''));
  });
});

suite('Kleane star operator - 0 or more repetitions', function () {
  test('Basic checks that * works', function () {
    var r = new Regex('prefix(abra)*suffix0*');
    assert(r.match('prefixsuffix'));
    assert(r.match('prefixsuffix0'));
    assert(r.match('prefixsuffix0000'));
    assert(r.match('prefixabrasuffix0000'));
    assert(r.match('prefixabraabrasuffix'));
    assert(!r.match('prefixabrabrasuffix'));
  });
  test('Empty string regex', function () {
    var r = new Regex('*');
    assert(r.match(''));
  });
});

