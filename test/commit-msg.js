'use strict';

var assert = require('assert');
var path = require('path');
var execFileSync = require('child_process').execFileSync;

var root = path.resolve(__dirname, '..');
var hook = path.relative(root, 'bin/commit-msg');
var validFile = path.relative(root,
    path.resolve(__dirname, './COMMIT_EDITMSG'));
var invalidFile = path.relative(root,
    path.resolve(__dirname, './COMMIT_EDITMSG-invalid'));

describe('commig-msg', function() {

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
        it('should exit with error status 9', function() {
            assert.throws(
                function() {
                    execFileSync('node', [hook, invalidFile], {
                        cwd: root,
                        encoding: 'utf8',
                        stdio: [null]
                    });
                },
                function(e) {
                    return e.status === 9;
                }
            );
        });
    });

});
