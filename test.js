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
  test('More chars at this place doesn\'t match', function () {
    assert(!r.match('Annt'));
    assert(!r.match('Anttt'));
  });
});

