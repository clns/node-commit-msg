'use strict';

var assert = require('assert');
var util = require('util');
var path = require('path');
var CommitMessage = require('..');
var Config = require('../lib/config');
var Error = require('../lib/error');
var GitHubRef = require('../lib/references/github');

var cfg = Config({
    imperativeVerbsInSubject: {
        alwaysCheck: true
    },
    references: {
        github: {
            token: process.env.GITHUB_TOKEN
        }
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
        in: ['Special chars: ./`,()[]\'"_3-~*$={}&;#+@<>%^|!'],
        errors: []
    },
    {
        describe: 'subject and body',
        in: ['Test commit with body',
        'This is a commit body to explain the changes.'],
        errors: []
    },
    {
        describe: 'subject and lengthy body',
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
        in: ['fix: i18n.po(2): Change login button text'],
        errors: []
    },
    {
        describe: 'valid issue reference',
        raw: 'Commit with issue ref\n\nFixes github/hub#1\n\n',
        in: ['Commit with issue ref',
        'Fixes github/hub#1'],
        errors: []
    },
    {
        describe: 'verbose commit',
        raw: 'Amend commit\n\n' +
        '- Fix something\n' +
        '- Change validation\n\n' +
        '# Please enter the commit message for your changes. Lines starting\n' +
        '# with \'#\' will be ignored, and an empty message aborts the commit.\n' +
        '# On branch master\n' +
        '# ------------------------ >8 ------------------------\n' +
        '# Everything below will be removed.\n\n' +
        'diff --git a/test/references/github.js b/test/references/github.js\n' +
        'index 5fd1577..59469e6 100644\n' +
        '--- a/test/references/github.js\n' +
        '+++ b/test/references/github.js\n' +
        '//   Property containing the entire matched string; eg. \'Closes #12\' or\n' +
        '+//   just \'#12\' if no specific keyword was given.\n' +
        '@@ -44,9 +44,9 @@ describe(\'references/github\', function() {\n' +
        'assert.equal(issues[12].match, \'pull request #34\');\n' +
        'assert.equal(issues[13].match, \'pull-request repo#11\');\n' +
        '});',
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
        raw: '\n\n# This is an empty commit message.\n' +
        '# ------------------------ >8 ------------------------\n' +
        '# Everything below will be removed.\n' +
        'diff ...',
        in: [''],
        errors: []
    },
    {
        describe: 'commit subject ending in lots of whitespaces',
        raw: 'Add commit message ending in lots of spaces                              \t ',
        in: ['Add commit message ending in lots of spaces'],
        errors: []
    },
    {
        describe: 'commit with \'squash!\'',
        in: ['squash! chore: Rename variable \'title\' to \'subject\''],
        errors: []
    },
    {
        describe: 'don\'t validate this squash! commit',
        in: ['squash! invalid commit that shouldn\'t validate'],
        errors: [],
        config: Config({squashFixup: {validateSquash: false}}, cfg)
    },
    {
        describe: 'commit with \'fixup!\'',
        in: ['fixup! not important commit message'],
        errors: []
    },
    {
        describe: 'rebase squash!',
        raw: '# This is a combination of 3 commits.\n' +
            '# The first commit\'s message is:\n' +
            'Add squash test\n' +
            '\n' +
            '# This is the 2nd commit message:\n' +
            '\n' +
            'squash! Add squash test\n' +
            '\n' +
            'Add nonsense1\n' +
            '\n' +
            '# This is the 3rd commit message:\n' +
            '\n' +
            'squash! Add squash test\n' +
            '\n' +
            '# Please enter the commit message for your changes. Lines starting\n' +
            '# with \'#\' will be ignored, and an empty message aborts the commit.\n' +
            '# rebase in progress; onto f331e47\n' +
            '#',
        in: ['Add squash test',
            'squash! Add squash test\n\n'+
            'Add nonsense1\n\n'+
            'squash! Add squash test'],
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
        describe: 'exceeding subject length soft limit',
        in: ['Add commit that exceeds the soft limit subject imposed by the config'],
        errors: [new Error(util.format('Commit subject should not exceed %d characters',
        cfg.subjectPreferredMaxLineLength.length), Error.WARNING, [1, cfg.subjectPreferredMaxLineLength.length])]
    },
    {
        describe: 'exceeding subject length hard limit',
        in: ['Add commit that exceeds the subject length hard limit imposed by the configuration'],
        errors: [new Error(util.format('Commit subject should not exceed %d characters',
        cfg.subjectMaxLineLength.length), Error.ERROR, [1, cfg.subjectMaxLineLength.length])]
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
        errors: [new Error('Commit subject should not end with a period',
        Error.ERROR, [1, 40])]
    },
    {
        describe: 'invalid characters',
        in: ['Commit message with §invalid chars'],
        errors: [new Error('Commit subject contains invalid characters',
        Error.ERROR, [1, 21])]
    },
    {
        describe: 'long body lines',
        in: ['Correct first line',
'commit body with very long lines that exceed the 72 characters limit imposed\n' +
'by git commit message best practices. These practices include the linux kernel\n' +
'and the git source.'],
        errors: [new Error(util.format('Line(s) 1, 2 in the commit body are ' +
        'longer than %d characters. Body lines should ' +
        'not exceed %d characters, except for compiler error ' +
        'messages or other "non-prose" explanation',
        cfg.bodyMaxLineLength.length, cfg.bodyMaxLineLength.length),
        Error.WARNING, [3, cfg.bodyMaxLineLength.length])]
    },
    {
        describe: 'long body lines (more than 3)',
        in: ['Correct first line',
'commit body with very long lines that exceed the 72 characters limit imposed\n' +
'by git commit message best practices. These practices include the linux kernel\n' +
'and the git source. This commit body contains more than 3 lines that exceed the\n' +
'max length. This sentence is added to make sure this line exceeds the limit we need.'],
        errors: [new Error(util.format('There are %d lines in the commit body ' +
        'that are longer than %d characters. Body lines should ' +
        'not exceed %d characters, except for compiler error ' +
        'messages or other "non-prose" explanation',
        4, cfg.bodyMaxLineLength.length, cfg.bodyMaxLineLength.length),
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
        describe: 'misplaced issue reference (in subject)',
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
        describe: 'invalid issue reference',
        in: ['Commit with invalid issue ref',
        'Fixes github/hub#123456789'],
        errors: [new Error('Reference github/hub#123456789 is not valid',
        Error.ERROR, [3, 1])]
    },
    {
        describe: 'invalid type in commit subject with past tense',
        in: ['l10n: Updated German translation of git (20t,0u)'],
        errors: [new Error('Commit subject contains invalid type l10n:', Error.ERROR, [1, 1]),
        new Error('Use imperative present tense, eg. "Fix bug" not ' +
        '"Fixed bug" or "Fixes bug". To get it right ask yourself: "If applied, ' +
        'this patch will <YOUR-COMMIT-MESSAGE-HERE>"', Error.ERROR, [1, 7])]
    },
    {
        describe: 'required type: component: Prefix',
        in: ['Change login button text for spanish language'],
        errors: [new Error('Commit subject should be prefixed by a type',
            Error.ERROR, [1, 1])],
        config: Config({
            imperativeVerbsInSubject: {
                alwaysCheck: true
            },
            types: {required: true}
        })
    },
    {
        describe: 'invalid issue reference should not be validated against the API',
        in: ['Invalid issue ref should not validate with API.',
        'Fixes github/hub#123456789'],
        errors: [new Error('Commit subject should not end with a period',
        Error.ERROR, [1, 47])]
    },
    {
        describe: 'subject starting with a space',
        in: [' Add invalid commit starting with a space'],
        errors: [new Error('Commit message should start with a capitalized letter',
            Error.ERROR, [1, 1])]
    },
    {
        describe: 'don\'t allow squash! commits',
        in: ['squash! Add commit that will be squashed'],
        errors: [new Error('squash! commits are not allowed', Error.ERROR, [1, 1])],
        config: Config({squashFixup: {allow: false}}, cfg)
    },
    {
        describe: 'don\'t allow fixup! commits',
        in: ['fixup! add commit that will be fixup\'ed'],
        errors: [new Error('fixup! commits are not allowed', Error.ERROR, [1, 1])],
        config: Config({squashFixup: {allow: false}}, cfg)
    }
];

var imperativeCases = [
    {msg: 'Merge branch \'master\' into feature-1'},
    {msg: 'Merge remote-tracking branch \'origin/master\''},
    {msg: 'Merge pull request #3 from github/hub'},
    {msg: 'Add install atom script for OS X'},
    {msg: 'Don\'t create delta for .bz2 files'},
    {msg: 'Remove disabled features'},
    {msg: 'Don\'t append number to \'$\' when encoding URI'},
    {msg: 'Remove useless and expired test'},
    {msg: 'Format numbers and currency using pattern'},
    {msg: 'Minor fixes regarding params serializers'}, // should pass 'FRAG' sentences
    {msg: 'CSS fixes'}
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
    {msg: 'docs: Updated Bulgarian translation', location: [1, 7]},
    {msg: 'Fixes bug', location: [1, 1]},
    {msg: 'Fixed bug', location: [1, 1]},
    {msg: 'Added fixes', location: [1, 1]},
    {msg: 'Disabled password validation', location: [1, 1]},
    {msg: 'Merged branch \'develop\' into master', location: [1, 1]},
    {msg: 'Merged changes into master branch', location: [1, 1]}
];

describe('CommitMessage', function() {

    describe('#parse()', function() {
        this.timeout(5000); // allow enough time

        cases.forEach(function(t) {
            var input = t.raw || t.in.join('\n\n');
            var failMsg = 'Message was:\n' + input;
            var errNo = t.errors.length;
            var itFn = t.skip ? it.skip : it;
            var expectErrors = !t.errors.every(function(e) { return !e.is(Error.ERROR); });
            var expectWarnings = !t.errors.every(function(e) { return !e.is(Error.WARNING); });
            var config = t.config || cfg;

            itFn(util.format('%s', t.describe), function(done) {
                CommitMessage.parse(input, config, function(err, validator) {
                    if (err) return done(err);

                    assert.deepEqual(validator._errors, t.errors, failMsg);
                    assert.equal(validator.hasErrors(), expectErrors, failMsg);
                    assert.equal(validator.hasWarnings(), expectWarnings, failMsg);

                    if (!validator.hasErrors() && !expectErrors) {
                        assert.equal(validator._subject, t.in[0], failMsg);
                        assert.equal(validator._body, t.in[1], failMsg);
                    }

                    done();
                });
            });
        }); // end cases.forEach

    }); // end #parse()

    describe('[non]imperative verbs', function() {
        this.timeout(20000); // allow enough time
        var cfg = Config({
            references: false
        });

        imperativeCases.forEach(function(input) {
            it('should be valid: ' + input.msg, function(done) {
                CommitMessage.parse(input.msg, cfg, function(err, validator) {
                    if (err) return done(err);

                    assert.deepEqual(validator._errors, []);
                    done();
                });
            });
        });

        nonImperativeCases.forEach(function(input) {
            it('should be invalid: ' + input.msg, function(done) {
                var error = new Error('Use imperative present tense, eg. "Fix bug" not ' +
                '"Fixed bug" or "Fixes bug". To get it right ask yourself: "If applied, ' +
                'this patch will <YOUR-COMMIT-MESSAGE-HERE>"', Error.ERROR, input.location);
                CommitMessage.parse(input.msg, cfg, function(err, validator) {
                    if (err) return done(err);

                    assert.deepEqual(validator._errors, [error]);
                    done();
                });
            });
        });
    }); // end [non]imperative verbs

    describe('#parseFromFile', function() {
        var file = path.resolve(__dirname, 'resources/COMMIT_EDITMSG');
        var relativeFile = path.relative(path.resolve(__dirname, '..'), file);

        it('should parse correctly ' + relativeFile, function(done) {
            CommitMessage.parseFromFile(file, function(err, validator) {
                if (err) return done(err);

                assert.deepEqual(validator._errors, []);
                assert.equal(validator._subject,
                    'Fix broken crypto_register_instance() module');

                done();
            });
        });

        it('should return error for non-existing file', function(done) {
            CommitMessage.parseFromFile('non-existing-file', function(err, validator) {
                assert.equal(err.code, 'ENOENT');
                done();
            });
        });
    }); // end #parseFromFile

    describe('special cases', function() {

        it('should be disabled', function(done) {
            CommitMessage.parse('Fixed bug.', {disable: true}, function(err, validator) {
                assert.equal(validator.hasErrors(), false);
                done();
            });
        });

        it('should resolve config correctly', function(done) {
            var angularConfig = path.resolve(__dirname, 'resources/angular');
            var failMsg = 'Config at ' + angularConfig;
            var cfg = CommitMessage.resolveConfigSync(angularConfig);
            assert.equal(cfg.subjectPreferredMaxLineLength, false, failMsg);
            assert.equal(cfg.capitalized.capital, false, failMsg);

            cfg = CommitMessage.resolveConfigSync(path.resolve(__dirname, '../..'));
            assert.equal(cfg, false, 'No package.json found');

            cfg = CommitMessage.resolveConfigSync(__dirname);
            assert.equal(typeof cfg, 'undefined', 'Config at ' + __dirname);

            CommitMessage.resolveConfig(__dirname, function(cfg) {
                assert.equal(typeof cfg, 'undefined', 'Config at ' + __dirname);

                CommitMessage.resolveConfig(path.resolve(__dirname, '../..'), function(cfg) {
                    assert.equal(cfg, false, 'No package.json found');
                    done();
                });
            });
        });

        it('should parse properties correctly', function(done) {
            var input = '\n# This is an empty commit message\n';
            var failMsg = 'The message was:\n' + input;
            CommitMessage.parse(input, function(err, validator) {
                if (err) throw err;

                assert.equal(validator.message, input, failMsg);
                assert.equal(validator.formattedMessages, '', failMsg);
                assert.equal(validator.hasErrors(), false, failMsg);
                assert.equal(validator.hasWarnings(), false, failMsg);

                done();
            });
        });

        it('custom error message from reference check', function(done) {
            var input = 'Commit without any reference';
            var errMsg = 'Commit should include a GitHub reference';
            var error = new Error(errMsg, Error.ERROR);
            var parseBak = GitHubRef.parse;
            GitHubRef.parse = function(text, config) {
                // Create a fake parse method that returns a single instance
                // with 'error' set and 'allowInSubject' true.
                var ref = new GitHubRef(undefined, undefined, undefined, undefined, cfg);
                ref.error = new Error(errMsg);
                ref._isPullRequest = true; // fake it to allow in subject
                ref.isValid = function(cb) { cb(null, false) } // prevent accessing the API for nothing
                return [ref];
            }
            CommitMessage.parse(input, cfg, function(err, validator) {
                if (err) throw err;
                GitHubRef.parse = parseBak; // put it back

                assert.deepEqual(validator._errors, [error]);
                assert.equal(validator.formattedMessages, error.toFormattedString());
                done();
            });
        });

    }); // end special cases

}); // end CommitMessage
