'use strict';

var assert = require('assert');
var util = require('util');
var path = require('path');
var CommitMessage = require('..');

var cfg = CommitMessage.prototype.config;
var cases = [
    {
        describe: 'simple message',
        raw: 'Test commit\n',
        in: ['Test commit'],
        errors: [],
        warnings: []
    },
    {
        describe: 'special characters',
        in: ['Test, (commit): with-\'special\' `characters.a`'],
        errors: [],
        warnings: []
    },
    {
        describe: 'title and body',
        in: ['Test commit with body',
        'This is a commit body to explain the changes.'],
        errors: [],
        warnings: []
    },
    {
        describe: 'title and lengthy body',
        in: ['Test commit with lengthy body',
        'This is the first paragraph\n' +
        'of the body. More paragraphs following.' +
        '\n\n' +
        'Some bullets here:' +
        '\n\n' +
        ' - bullet point 1\n' +
        ' - bullet point 2' +
        '\n\n' +
        ' - bullet point 3'],
        errors: [],
        warnings: []
    },
    {
        describe: 'empty commit',
        in: [''],
        errors: ['Commit message is not in the correct format, see\n'+
        'https://github.com/clns/node-commit-msg/blob/master/CONTRIBUTING.md#commit-message'],
        warnings: []
    },
    {
        describe: 'invalid format',
        in: ['\nCommit message starting with newline'],
        errors: ['Commit message is not in the correct format, see\n'+
        'https://github.com/clns/node-commit-msg/blob/master/CONTRIBUTING.md#commit-message'],
        warnings: []
    },
    {
        describe: 'invalid format',
        in: ['Correct summary',
        '\nBody starting with newline'],
        errors: ['Commit message is not in the correct format, see\n'+
        'https://github.com/clns/node-commit-msg/blob/master/CONTRIBUTING.md#commit-message'],
        warnings: []
    },
    {
        describe: 'starting with a lowercase letter',
        in: ['commit message with lowercase first letter'],
        errors: ['Commit message should start with a capitalized letter'],
        warnings: []
    },
    {
        describe: 'ending with a period',
        in: ['Commit message ending with a period.'],
        errors: ['First line (summary) should not end with a period'],
        warnings: []
    },
    {
        describe: 'invalid characters',
        in: ['Commit message with <invalid> chars'],
        errors: ['First line (summary) contains invalid characters'],
        warnings: []
    },
    {
        describe: 'long body lines',
        in: ['Correct first line',
'Commit body with very long lines that exceed the 72 characters limit imposed\n' +
'by git commit message best practices. These practices include the linux kernel\n' +
'and the git source.'],
        errors: [],
        warnings: [util.format('Lines 1, 2 in the commit body are ' +
        'longer than %d characters. Body lines should ' +
        'not exceed %d characters, except for compiler error ' +
        'messages or other "non-prose" explanation',
        cfg.preferredBodyMaxLineLength, cfg.preferredBodyMaxLineLength)]
    },
    {
        describe: 'no imperative present tense',
        in: ['Changes profile picture delete feature'],
        errors: [],
        warnings: ['Detected \'Changes\' instead of \'Change\', use only imperative ' +
        'present tense'],
        skip: true
    }
];

describe('CommitMessage', function() {

    describe('#parse()', function() {

        cases.forEach(function(t) {
            var input = t.raw || t.in.join('\n\n');
            var message = CommitMessage.parse(input);
            var failMsg = 'Message was:\n' + input;
            var errNo = t.errors.length;
            var warNo = t.warnings.length;
            var itFn = t.skip ? it.skip : it;

            describe(t.describe, function() {

                itFn(util.format('should have %d error(s)', errNo), function() {
                    assert.deepEqual(message._errors, t.errors, failMsg);
                });

                itFn(util.format('should have %d warning(s)', warNo), function() {
                    assert.deepEqual(message._warnings, t.warnings, failMsg);
                });

                if (message.valid && !t.errors.length) {
                    itFn('should have the correct title', function() {
                        // if (!message.valid) {
                        //     this.test.skip();
                        // }
                        assert.equal(message._title, t.in[0], failMsg);
                    });

                    itFn('should have the correct body', function() {
                        assert.equal(message._body, t.in[1], failMsg);
                    });

                    itFn('should validate imperative present tense');
                    itFn('should identify github issues correctly');
                }

            });
        }); // end forEach

    }); // end #parse()

    describe('#parseFromFile', function() {
        describe('valid file', function() {
            var file = path.resolve(__dirname, './COMMIT_EDITMSG');
            var message = CommitMessage.parseFromFile(file);
            var failMsg = 'Fail to read from ' + path.relative(
                path.resolve(__dirname, '..'), file
            );

            it('should have 0 errors', function() {
                assert.deepEqual(message._errors, [], failMsg);
            });

            it('should have 0 warnings', function() {
                assert.deepEqual(message._warnings, [], failMsg);
            });

            it('should have the correct title', function() {
                assert.equal(message._title,
                    'Fix broken crypto_register_instance() module', failMsg);
            });
        });
    });

}); // end CommitMessage
