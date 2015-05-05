'use strict';

var assert = require('assert');
var util = require('util');
var path = require('path');
var CommitMessage = require('..');
var Error = require('../lib/error');

var cfg = CommitMessage.prototype.config;
var cases = [
    {
        describe: 'simple message',
        raw: 'Test commit\n',
        in: ['Test commit'],
        errors: []
    },
    {
        describe: 'special characters',
        in: ['Special chars: ./`,()[]\'"_3-~*$={}&;#'],
        errors: []
    },
    {
        describe: 'title and body',
        in: ['Test commit with body',
        'This is a commit body to explain the changes.'],
        errors: []
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
        errors: []
    },
    {
        describe: 'semver (tag) commit',
        in: ['v1.0.0-alpha'],
        errors: []
    },
    {
        describe: 'type: component: Prefix',
        in: ['fix: i18n.po(2): Change login button text for spanish language'],
        errors: []
    },
    {
        describe: 'issue reference',
        in: ['Commit with issue ref',
        'Fixes github/github#12'],
        errors: []
    },
    {
        describe: 'commit with comments',
        in: ['Amend commit',
        '- Fix something\n' +
        '- Change validation\n\n' +
        '# Please enter the commit message for your changes. Lines starting\n' +
        '# with \'#\' will be ignored, and an empty message aborts the commit.\n' +
        '# On branch master'],
        errors: []
    },
    {
        describe: 'no main verb present',
        in: ['Small changes'],
        errors: []
    },
    {
        describe: 'empty commit',
        in: [''],
        errors: [new Error('Commit message is not in the correct format, see\n'+
        'https://github.com/clns/node-commit-msg/blob/master/CONTRIBUTING.md#commit-message',
        Error.ERROR)]
    },
    {
        describe: 'title starting with newline',
        in: ['\nCommit message starting with newline'],
        errors: [new Error('Commit message is not in the correct format, see\n'+
        'https://github.com/clns/node-commit-msg/blob/master/CONTRIBUTING.md#commit-message',
        Error.ERROR)]
    },
    {
        describe: 'body starting with newline',
        in: ['Correct summary',
        '\nBody starting with newline'],
        errors: [new Error('Commit message is not in the correct format, see\n'+
        'https://github.com/clns/node-commit-msg/blob/master/CONTRIBUTING.md#commit-message',
        Error.ERROR)]
    },
    {
        describe: 'exceeding title length soft limit',
        in: ['Add commit that exceeds the soft limit title imposed by the config'],
        errors: [new Error(util.format('First line (summary) should not exceed %d characters',
        cfg.titlePreferredMaxLineLength[0]), Error.WARNING, [1, cfg.titlePreferredMaxLineLength[0]])]
    },
    {
        describe: 'exceeding title length hard limit',
        in: ['Add commit that exceeds the title length hard limit imposed by the configuration'],
        errors: [new Error(util.format('First line (summary) should not exceed %d characters',
        cfg.titleMaxLineLength[0]), Error.ERROR, [1, cfg.titleMaxLineLength[0]])]
    },
    {
        describe: 'starting with a lowercase letter',
        in: ['commit message with lowercase first letter'],
        errors: [new Error('Commit message should start with a capitalized letter',
        Error.ERROR, [1, 1])]
    },
    {
        describe: 'ending with a period',
        in: ['Add commit message ending with a period.'],
        errors: [new Error('First line (summary) should not end with a period or whitespace',
        Error.ERROR, [1, 40])]
    },
    {
        describe: 'ending with whitespace',
        in: ['Add commit message ending with a whitespace '],
        errors: [new Error('First line (summary) should not end with a period or whitespace',
        Error.ERROR, [1, 44])]
    },
    {
        describe: 'invalid characters',
        in: ['Commit message with <invalid> chars'],
        errors: [new Error('First line (summary) contains invalid characters',
        Error.ERROR, [1, 21])]
    },
    {
        describe: 'long body lines and lowercase first letter',
        in: ['Correct first line',
'commit body with very long lines that exceed the 72 characters limit imposed\n' +
'by git commit message best practices. These practices include the linux kernel\n' +
'and the git source.'],
        errors: [new Error('Body should start with a capitalized letter',
        Error.ERROR, [3, 1]),
            new Error(util.format('Lines 1, 2 in the commit body are ' +
        'longer than %d characters. Body lines should ' +
        'not exceed %d characters, except for compiler error ' +
        'messages or other "non-prose" explanation',
        cfg.bodyMaxLineLength[0], cfg.bodyMaxLineLength[0]),
        Error.WARNING, [3, cfg.bodyMaxLineLength[0]])]
    },
    {
        describe: 'invalid whitespace (space)',
        in: ['Commit  with 2 consecutive spaces'],
        errors: [new Error('First line (summary) contains invalid whitespace',
        Error.ERROR, [1, 7])]
    },
    {
        describe: 'invalid whitespace (tab)',
        in: ['Commit with\ttab'],
        errors: [new Error('First line (summary) contains invalid characters',
        Error.ERROR, [1, 12])]
    },
    {
        describe: 'misplaced issue reference (in title)',
        in: ['Commit fixes #12'],
        errors: [new Error('Issue references should be placed in the last paragraph of the body',
        Error.WARNING, [1, 8])]
    },
    {
        describe: 'misplaced issue reference (in body)',
        in: ['Commit with issue ref',
        'Explanation: fixes github-user/repo_1.git#12' +
        '\n\n' +
        'This body contains a misplaced issue ref.'],
        errors: [new Error('Issue references should be placed in the last paragraph of the body',
        Error.WARNING, [3, 14])]
    },
    {
        describe: 'invalid type in commit title with past tense',
        in: ['l10n: Updated Bulgarian translation of git (230t,0f,0u)'],
        errors: [new Error('Invalid type l10n:', Error.ERROR, [1, 1]),
        new Error('Use imperative present tense, eg. "Fix bug" not ' +
        '"Fixed bug" or "Fixes bug". To get it right ask yourself: "If applied, ' +
        'this patch will <YOUR-COMMIT-MESSAGE-HERE>"', Error.ERROR, [1, 7])]
    }
];

var imperativeCases = [
    // This was throwing exception because it doesn't parse as a sentence S.
    // It's also not detected correctly as past tense because of
    // the <type>: prefix which confuses the parser
    {msg: 'L10n1#: Updated Bulgarian translation'}
];

var nonImperativeCases = [
    {msg: 'Changing profile picture', location: [1, 1]},
    {msg: 'Implemented new feature', location: [1, 1]},
    {msg: 'Implementing new feature', location: [1, 1]},
    {msg: 'Implements new feature', location: [1, 1]},
    {msg: 'Merged changes into master branch', location: [1, 1]},
    {msg: 'Manually merged changes into master', location: [1, 10]},
    {msg: 'Sending the old record to the gateway', location: [1, 1]},
    {msg: 'Included new library', location: [1, 1]}
    // {msg: 'Disabled password validation', location: [1, 1]}
];

describe('CommitMessage', function() {

    describe('#parse()', function() {

        cases.forEach(function(t) {
            var input = t.raw || t.in.join('\n\n');
            var message = CommitMessage.parse(input);
            var failMsg = 'Message was:\n' + input;
            var errNo = t.errors.length;
            var itFn = t.skip ? it.skip : it;
            var expectErrors = !t.errors.every(function(e) { return !e.is(Error.ERROR); });

            describe(t.describe, function() {

                itFn(util.format('should have %d error(s)', errNo), function() {
                    assert.deepEqual(message._errors, t.errors, failMsg);
                });

                if (!message.hasErrors() && !expectErrors) {
                    itFn('should have the correct title', function() {
                        assert.equal(message._title, t.in[0], failMsg);
                    });

                    itFn('should have the correct body', function() {
                        assert.equal(message._body, t.in[1], failMsg);
                    });
                }

            });
        }); // end cases.forEach

    }); // end #parse()

    describe('[non]imperative verbs', function() {
        this.timeout(20000); // allow enough time

        it('should have no errors', function() {
            imperativeCases.forEach(function(input) {
                var message = CommitMessage.parse(input.msg);

                assert.deepEqual(message._errors, [], 'Message was:\n' + input.msg);
            });
        });

        it('should have error', function() {
            nonImperativeCases.forEach(function(input) {
                var err = new Error('Use imperative present tense, eg. "Fix bug" not ' +
                '"Fixed bug" or "Fixes bug". To get it right ask yourself: "If applied, ' +
                'this patch will <YOUR-COMMIT-MESSAGE-HERE>"', Error.ERROR, input.location);
                var message = CommitMessage.parse(input.msg);

                assert.deepEqual(message._errors, [err], 'Message was:\n' + input.msg);
            });
        });
    }); // end non-imporative verbs

    describe('#parseFromFile', function() {
        describe('valid file', function() {
            var file = path.resolve(__dirname, 'resources/COMMIT_EDITMSG');
            var message = CommitMessage.parseFromFile(file);
            var failMsg = 'Message read from ' + path.relative(
                path.resolve(__dirname, '..'), file
            );

            it('should have 0 errors', function() {
                assert.deepEqual(message._errors, [], failMsg);
            });

            it('should have the correct title', function() {
                assert.equal(message._title,
                    'Fix broken crypto_register_instance() module');
            });
        });
    });

}); // end CommitMessage
