'use strict';

var assert = require('assert');
var util = require('util');
var path = require('path');
var CommitMessage = require('..');
var Config = require('../lib/config');
var Error = require('../lib/error');

var cfg = Config({
    imperativeVerbsInTitle: {
        alwaysCheck: true
    }
});

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
        raw: 'Amend commit\n\n' +
        '- Fix something\n' +
        '- Change validation\n\n' +
        '# Please enter the commit message for your changes. Lines starting\n' +
        '# with \'#\' will be ignored, and an empty message aborts the commit.\n' +
        '# On branch master\n' +
        '# Everything below this line will be ignored.\n\n' +
        'diff ...',
        in: ['Amend commit',
        '- Fix something\n' +
        '- Change validation'],
        errors: []
    },
    {
        describe: 'no main verb present',
        in: ['Small changes'],
        errors: []
    },
    {
        describe: 'empty commit message',
        in: [''],
        errors: []
    },
    {
        describe: 'empty commit message with comments',
        raw: '\n\n#This is an empty commit message.\nEverything below ' +
        'this line will be ignored.\n\ndiff ...',
        in: [''],
        errors: []
    },
    {
        describe: 'body starting with newline',
        in: ['Correct subject',
        '\nBody starting with newline'],
        errors: [new Error('Commit message is not in the correct format; subject (first line) ' +
        'and body should be separated by one empty line',
        Error.ERROR)]
    },
    {
        describe: 'exceeding title length soft limit',
        in: ['Add commit that exceeds the soft limit title imposed by the config'],
        errors: [new Error(util.format('Commit subject should not exceed %d characters',
        cfg.titlePreferredMaxLineLength.length), Error.WARNING, [1, cfg.titlePreferredMaxLineLength.length])]
    },
    {
        describe: 'exceeding title length hard limit',
        in: ['Add commit that exceeds the title length hard limit imposed by the configuration'],
        errors: [new Error(util.format('Commit subject should not exceed %d characters',
        cfg.titleMaxLineLength.length), Error.ERROR, [1, cfg.titleMaxLineLength.length])]
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
        errors: [new Error('Commit subject should not end with a period or whitespace',
        Error.ERROR, [1, 40])]
    },
    {
        describe: 'invalid characters',
        in: ['Commit message with <invalid> chars'],
        errors: [new Error('Commit subject contains invalid characters',
        Error.ERROR, [1, 21])]
    },
    {
        describe: 'long body lines',
        in: ['Correct first line',
'commit body with very long lines that exceed the 72 characters limit imposed\n' +
'by git commit message best practices. These practices include the linux kernel\n' +
'and the git source.'],
        errors: [new Error(util.format('Lines 1, 2 in the commit body are ' +
        'longer than %d characters. Body lines should ' +
        'not exceed %d characters, except for compiler error ' +
        'messages or other "non-prose" explanation',
        cfg.bodyMaxLineLength.length, cfg.bodyMaxLineLength.length),
        Error.WARNING, [3, cfg.bodyMaxLineLength.length])]
    },
    {
        describe: 'invalid whitespace (space)',
        in: ['Commit  with 2 consecutive spaces'],
        errors: [new Error('Commit subject contains invalid whitespace',
        Error.ERROR, [1, 7])]
    },
    {
        describe: 'invalid whitespace (tab)',
        in: ['Commit with\ttab'],
        errors: [new Error('Commit subject contains invalid characters',
        Error.ERROR, [1, 12])]
    },
    {
        describe: 'misplaced issue reference (in title)',
        in: ['Commit fixes #12'],
        errors: [new Error('References should be placed in the last paragraph of the body',
        Error.ERROR, [1, 8])]
    },
    {
        describe: 'misplaced issue reference (in body)',
        in: ['Commit with issue ref',
        'Explanation: fixes github-user/repo_1.git#12' +
        '\n\n' +
        'This body contains a misplaced issue ref.'],
        errors: [new Error('References should be placed in the last paragraph of the body',
        Error.ERROR, [3, 14])]
    },
    {
        describe: 'invalid type in commit title with past tense',
        in: ['l10n: Updated Bulgarian translation of git (230t,0f,0u)'],
        errors: [new Error('Commit subject contains invalid type l10n:', Error.ERROR, [1, 1]),
        new Error('Use imperative present tense, eg. "Fix bug" not ' +
        '"Fixed bug" or "Fixes bug". To get it right ask yourself: "If applied, ' +
        'this patch will <YOUR-COMMIT-MESSAGE-HERE>"', Error.ERROR, [1, 7])]
    }
];

var imperativeCases = [
    // This was throwing an exception because the two sentences
    // 'Add install atom script for OS X.' and 'I Add install atom script for OS X.'
    // are treated as one sentece because of the 'OS X.' termination ('X.' is
    // considered a word instead of only 'X' without the dot)
    {msg: 'Add install atom script for OS X'},
    // Thinks it's not in imperative mood
    {msg: 'Don\'t create delta for .bz2 files'}
];

var nonImperativeCases = [
    {msg: 'Changing profile picture', location: [1, 1]},
    {msg: 'Implemented new feature', location: [1, 1]},
    {msg: 'Implementing new feature', location: [1, 1]},
    {msg: 'Implements new feature', location: [1, 1]},
    {msg: 'Merged changes into master branch', location: [1, 1]},
    {msg: 'Manually merged changes into master', location: [1, 10]},
    {msg: 'Sending the old record to the gateway', location: [1, 1]},
    {msg: 'Included new library', location: [1, 1]},
    // This was throwing an exception because it doesn't parse as a sentence S.
    // It's also not detected correctly as past tense because of
    // the <type>: prefix which confuses the parser
    {msg: 'docs: Updated Bulgarian translation', location: [1, 7]}
    // {msg: 'Disabled password validation', location: [1, 1]}
];

describe('CommitMessage', function() {

    describe('#parse()', function() {

        cases.forEach(function(t) {
            var input = t.raw || t.in.join('\n\n');
            var failMsg = 'Message was:\n' + input;
            var errNo = t.errors.length;
            var itFn = t.skip ? it.skip : it;
            var expectErrors = !t.errors.every(function(e) { return !e.is(Error.ERROR); });

            itFn(util.format('should parse %s', t.describe), function(done) {
                CommitMessage.parse(input, cfg, function(err, message) {
                    if (err) return done(err);

                    assert.deepEqual(message._errors, t.errors, failMsg);

                    if (!message.hasErrors() && !expectErrors) {
                        assert.equal(message._title, t.in[0], failMsg);
                        assert.equal(message._body, t.in[1], failMsg);
                    }

                    done();
                });
            });
        }); // end cases.forEach

    }); // end #parse()

    describe('[non]imperative verbs', function() {
        this.timeout(20000); // allow enough time

        imperativeCases.forEach(function(input) {
            it('should be valid: ' + input.msg, function(done) {
                CommitMessage.parse(input.msg, function(err, message) {
                    if (err) return done(err);

                    assert.deepEqual(message._errors, []);
                    done();
                });
            });
        });

        nonImperativeCases.forEach(function(input) {
            it('should be invalid: ' + input.msg, function(done) {
                var error = new Error('Use imperative present tense, eg. "Fix bug" not ' +
                '"Fixed bug" or "Fixes bug". To get it right ask yourself: "If applied, ' +
                'this patch will <YOUR-COMMIT-MESSAGE-HERE>"', Error.ERROR, input.location);
                CommitMessage.parse(input.msg, function(err, message) {
                    if (err) return done(err);

                    assert.deepEqual(message._errors, [error]);
                    done();
                });
            });
        });
    }); // end non-imporative verbs

    describe('#parseFromFile', function() {
        var file = path.resolve(__dirname, 'resources/COMMIT_EDITMSG');
        var relativeFile = path.relative(path.resolve(__dirname, '..'), file);

        it('should parse correctly ' + relativeFile, function(done) {
            CommitMessage.parseFromFile(file, function(err, message) {
                if (err) return done(err);

                assert.deepEqual(message._errors, []);
                assert.equal(message._title,
                    'Fix broken crypto_register_instance() module');

                done();
            });
        });
    });

}); // end CommitMessage
