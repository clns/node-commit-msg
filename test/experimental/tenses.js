'use strict';

var assert = require('assert');
var util = require('util');
var nlp = require("nlp_compromise");

var valid = [
    'Merge remote-tracking branch \'origin/master\'',
    'Text change',
    'Add custom focus function',
    'Render maintenance message if site channel is in offline mode',
    'Add site channel offline mode option',
    'Optimizations',
    'Skip duplicate check in data map api',
    'Only get id fields in finds for Recurring data map api',
    'Fix exception being called too late and code failing before it\'s call',
    'Skip system message and duplicate check in data map api',
    'Disable password validation when saving user from data map api',
    'Disable cacheQueries',
    'CSS and layout changes'
];
var invalid = [
    'Changed body font-size to 1.28rem (18px)',
    'Added fields parameter in Person->findByExternalData',
    'Disabled password validation when saving user from data map api',
    'Hid checkout image and added linear gradient fix to checkout and to project full',
    'Added button class to solve WYSIWYG issue'
];

function censor(censor) {
  var i = 0;

  return function(key, value) {
    if(i !== 0 && typeof(censor) === 'object' && typeof(value) == 'object' && censor == value)
      return '[Circular]';

    if(i >= 29) // seems to be a harded maximum of 30 serialized objects?
      return '[Unknown]';

    ++i; // so we know we aren't using the original object anymore

    return value;
  }
}

describe('verb tenses', function() {

    describe(util.format('%d valid tenses', valid.length), function() {
        valid.forEach(function(input) {
            var sentences = nlp.pos(input).sentences;

            it('should contain one sentence', function() {
                assert.equal(sentences.length, 1);
            });

            it('should be valid', function() {
                var s = sentences[0];
                var tense = s.tense();
                var isValid = !tense.length || ['VBP'].indexOf(s.verbs()[0].pos.tag)!==-1;
                var failMsg = 'Message was:\n' + s.text();
                s.tokens.forEach(function(t) {
                    failMsg += '\n\n' + JSON.stringify(t, censor(t));
                });

                assert(isValid, failMsg);
            });
        });
    });

    describe(util.format('%d invalid tenses', invalid.length), function() {
        invalid.forEach(function(input) {
            var sentences = nlp.pos(input).sentences;

            it('should contain one sentence', function() {
                assert.equal(sentences.length, 1);
            });

            it('should not validate', function() {
                var s = sentences[0];
                var tense = s.tense();
                var isValid = !tense.length || ['VBP'].indexOf(s.verbs()[0].pos.tag)!==-1;
                var failMsg = 'Message was:\n' + s.text() + '\n\n' + JSON.stringify(s.tokens, censor(s.tokens));

                assert(!isValid, failMsg);
            });
        });
    });

}); // describe verb tenses
