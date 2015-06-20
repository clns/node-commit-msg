'use strict';

// This tests the install/uninstall with different
// configuration options, in both normal and bare repositories.
//
// The '_' in the name is to make sure this runs first.

var assert = require('assert');
var path = require('path');
var fs = require('fs');
var execSync = require('child_process').execSync;
var g = require('./global-hooks');
var root = path.resolve(__dirname, '..');
var packageJson = path.join(root, 'package.json');
var commitMsgHook, updateHook;
var stats, canExecute;
var repo;

describe('setup', function() {
    this.timeout(40000);

    describe('install', function() {

        it('should install with default settings', function() {
            repo = g.clone1;
            commitMsgHook = path.join(repo, '.git/hooks/commit-msg');
            updateHook = path.join(repo, '.git/hooks/update');

            assert.doesNotThrow(function() {
                execSync('npm install --production --no-optional', {cwd: repo, stdio: [null]});
            });

            assert(fs.lstatSync(commitMsgHook).isSymbolicLink(), 'commit-msg is not symbolic link');
            assert(fs.lstatSync(updateHook).isSymbolicLink(), 'update is not symbolic link');

            // mask 1=can execute, 4=can read, 2=can write
            // http://stackoverflow.com/a/11781404/1104534
            var isWin = /^win/.test(process.platform);
            if (!isWin) {
                var mask = 1;
                stats = fs.statSync(commitMsgHook);
                canExecute = !!(mask & parseInt ((stats.mode & parseInt ("777", 8)).toString (8)[0]));
                assert(canExecute, 'commit-msg is not executable');
                stats = fs.statSync(updateHook);
                canExecute = !!(mask & parseInt ((stats.mode & parseInt ("777", 8)).toString (8)[0]));
                assert(canExecute, 'update is not executable');
            }
        });

        it('should install in a bare repository', function() {
            repo = g.origin;
            commitMsgHook = path.join(repo, 'hooks/commit-msg');
            updateHook = path.join(repo, 'hooks/update');

            assert.doesNotThrow(function() {
                execSync('npm install --production', {cwd: repo, stdio: [null]});
            });
            assert.doesNotThrow(function() {
                fs.statSync(path.join(repo, 'node_modules/commit-msg'));
            });
            assert.throws(
                function() {
                    fs.statSync(commitMsgHook);
                },
                /ENOENT/
            );
            assert(fs.lstatSync(updateHook).isSymbolicLink(), 'update is not symbolic link');
        });

    }); // end describe install

    describe('lite install/uninstall with different configurations', function() {

        before('remove dependencies from package.json', function() {
            var json = require(packageJson);
            delete json.dependencies;
            fs.writeFileSync(packageJson, JSON.stringify(json));
        });

        after('restore original package.json', function() {
            execSync('git checkout package.json', {cwd: root});
        });

        it('should install/uninstall only the client hook (package.json restriction)', function() {
            repo = g.clone2;
            commitMsgHook = path.join(repo, '.git/hooks/commit-msg');
            updateHook = path.join(repo, '.git/hooks/update');

            assert.doesNotThrow(function() {
                execSync('npm install --production --no-optional', {cwd: repo, stdio: [null]});
            });

            assert.doesNotThrow(function() {
                fs.statSync(commitMsgHook);
            });
            assert.throws(
                function() {
                    fs.statSync(updateHook);
                },
                /ENOENT/
            );

            assert.doesNotThrow(function() {
                execSync('npm uninstall commit-msg', {cwd: repo, stdio: [null]});
            });
            assert.throws(
                function() {
                    fs.statSync(commitMsgHook);
                },
                /ENOENT/
            );
        });

        it('should install/uninstall only the server hook (package.json restriction)', function() {
            repo = g.clone3;
            commitMsgHook = path.join(repo, '.git/hooks/commit-msg');
            updateHook = path.join(repo, '.git/hooks/update');

            assert.doesNotThrow(function() {
                execSync('npm install --production --no-optional', {cwd: repo, stdio: [null]});
            });

            assert.doesNotThrow(function() {
                fs.statSync(updateHook);
            });
            assert.throws(
                function() {
                    fs.statSync(commitMsgHook);
                },
                /ENOENT/
            );

            assert.doesNotThrow(function() {
                execSync('npm uninstall commit-msg', {cwd: repo, stdio: [null]});
            });
            assert.throws(
                function() {
                    fs.statSync(updateHook);
                },
                /ENOENT/
            );
        });

        it('should not install any hooks (git config restriction)', function() {
            repo = g.clone4;
            commitMsgHook = path.join(repo, '.git/hooks/commit-msg');
            updateHook = path.join(repo, '.git/hooks/update');

            assert.doesNotThrow(function() {
                execSync('npm install --production --no-optional', {cwd: repo, stdio: [null]});
            });

            assert.throws(
                function() {
                    fs.statSync(commitMsgHook);
                },
                /ENOENT/
            );
            assert.throws(
                function() {
                    fs.statSync(updateHook);
                },
                /ENOENT/
            );
        });

    }); // end describe lite install/uninstall with different configurations

}); // end setup
