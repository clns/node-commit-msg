'use strict';

// Tests based on the Angular Git Commit guidelines
// https://github.com/angular/angular.js/blob/master/CONTRIBUTING.md#commit
//
// It uses the config file from 'test/resources/angular/package.json'

var assert = require('assert');
var util = require('util');
var path = require('path');
var CommitMessage = require('..');
var Error = require('../lib/error');

var configBaseDir = path.resolve(__dirname, 'resources/angular');

var cases = [
    {
        describe: 'commit from Jun 3, 2015',
        in: ['fix(ngAria): update `aria-valuemin/max` when `min/max` change',
        'As a result of thi fix, `ngMin/Max` also set `aria-valuemin/max` on\n' +
        '"range"-shaped elements.\n\n' +
        'Fixes #11770'],
        errors: []
    },
    {
        describe: 'commit from Jun 1, 2015',
        in: ['refactor($compile): remove unused elementTransclusion argument',
        'Remove the unused elementTransclusion argument from createBoundTranscludeFn.\n' +
        'Also remove the nodeLinkFn.elementTranscludeOnThisElement attribute, which\n' +
        'becomes unnecessary.'],
        errors: []
    },
    {
        describe: 'first letter capitalized',
        in: ['refactor($compile): Remove unused elementTransclusion argument'],
        errors: [new Error('Commit message should start with a lowercase letter',
            Error.ERROR, [1, 21])]
    },
    {
        describe: 'subject longer than 100 chars',
        in: ['refactor($compile): remove unused elementTransclusion argument and add some more text to exceed max length'],
        errors: [new Error('Commit subject should not exceed 100 characters',
            Error.ERROR, [1, 100])]
    },
    {
        describe: 'invalid type',
        in: ['security($compile): remove unused elementTransclusion'],
        errors: [new Error('Commit subject contains invalid type security($compile):',
            Error.ERROR, [1, 1])]
    },
    {
        describe: 'no type',
        in: ['remove unused elementTransclusion'],
        errors: [new Error('Commit subject should be prefixed by a type',
            Error.ERROR, [1, 1])]
    }
];

describe('angular guidelines', function() {

    cases.forEach(function(t) {
        var input = t.raw || t.in.join('\n\n');
        var failMsg = 'Message was:\n' + input;
        var errNo = t.errors.length;
        var itFn = t.skip ? it.skip : it;
        var expectErrors = !t.errors.every(function(e) { return !e.is(Error.ERROR); });
        var expectWarnings = !t.errors.every(function(e) { return !e.is(Error.WARNING); });

        itFn(util.format('should parse %s', t.describe), function(done) {
            this.timeout(3000); // allow enough time
            CommitMessage.parse(input, configBaseDir, function(err, message) {
                if (err) return done(err);

                assert.deepEqual(message._errors, t.errors, failMsg);
                assert.equal(message.hasErrors(), expectErrors, failMsg);
                assert.equal(message.hasWarnings(), expectWarnings, failMsg);

                if (!message.hasErrors() && !expectErrors) {
                    assert.equal(message._title, t.in[0], failMsg);
                    assert.equal(message._body, t.in[1], failMsg);
                }

                done();
            });
        });
    }); // end cases.forEach

}); // end angular guidelines
