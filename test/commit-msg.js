'use strict';

// Tests the 'commit-msg' hook

var assert = require('assert');
var path = require('path');
var execFileSync = require('child_process').execFileSync;
var execSync = require('child_process').execSync;
var fs = require('fs');
var g = require('./global-hooks');

var root = path.resolve(__dirname, '..');
var hook = path.relative(root, 'bin/commit-msg');
var validFile = path.relative(root,
    path.resolve(__dirname, 'resources/COMMIT_EDITMSG'));
var invalidFile = path.relative(root,
    path.resolve(__dirname, 'resources/COMMIT_EDITMSG-invalid'));

describe('commig-msg', function() {
    this.timeout(5000); // allow enough time

    describe('valid', function() {
        it('should exit with status 0', function() {
            assert.doesNotThrow(
                function() {
                    execFileSync('node', [hook, validFile], {
                        cwd: root,
                        encoding: 'utf8',
                        stdio: [null]
                    });
                }
            );
        });
    });

    describe('invalid', function() {
        it('should exit with error status 1', function() {
            assert.throws(
                function() {
                    execFileSync('node', [hook, invalidFile], {
                        cwd: root,
                        encoding: 'utf8',
                        stdio: [null]
                    });
                },
                function(e) {
                    return e.status === 1;
                }
            );
        });

        it('should reject an invalid commit', function() {
            var repo = g.clone1;
            fs.writeFileSync(path.join(repo, 'invalid-commit.txt'), 'added by the commit-msg test ' + new Date().getTime());

            assert.throws(
                function() {
                    execSync('git add .; git commit -m "Add invalid commit."', {cwd: repo, stdio: [null]});
                },
                null,
                'Needs \'setup\' test suite to run before this'
            );
        });
    });

});
