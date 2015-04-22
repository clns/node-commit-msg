'use strict';

// This will test the commit validator against some repositories
// hosted on GitHub that are known for using proper commit messages.
//
// This file is intentionally added into a subdirectory of test/
// so it won't run with normal tests. To run it use:
//
// - `npm run test-external`
//
// To run all tests use:
//
// - `npm test-all`

var assert = require('assert');
var util = require('util');
var https = require('https');
var url = require('url');
var clone = require('clone');
var CommitMessage = require('../..');
var Error = require('../../lib/error');

var repos = [
    // {
    //     repo: 'clns/node-commit-msg',
    //     limit: 60
    // }
    // {
    //     repo: 'tpope/vim-pathogen',
    //     limit: 30,
    //     useExceptions: true
    // }
    // {
    //     repo: 'git/git',
    //     limit: 30, // how many (latest) commits to test
    //     useExceptions: true
    // }
    // {
    //     repo: 'torvalds/linux',
    //     limit: 30,
    //     useExceptions: true
    // }
];


// Helper stuff

var cfg = CommitMessage.prototype.config;
var originalCfg = clone(cfg);
var exceptions = [
    // tpope/vim-pathogen
    'Use $VIMBLACKLIST to temporarily disable bundles', // body starts with indent
    'pathogen.vim 2.3',
    'pathogen#slash() alias for pathogen#separator()',
    'pathogen.vim 2.2',
    'pathogen.vim 2.1',
    'Automatic lcd on :Vsplit, etc.',
    'pathogen.vim 2.0',
    // git/git repo
    "l10n: de.po: translate 'symbolic link' as 'symbolische Verknüpfung'",
    'Sync with 2.3.5', // body doesn't start with capitalized letter
    'Sync with maint', // body doesn't start with capitalized letter
    // torvalds/linux repo
    'Break up monolithic iommu table/lock into finer graularity pools and lock',
    'sparc: Revert generic IOMMU allocator.',
    'Input: elan_i2c - fix calculating number of x and y traces.',
    'tools/power turbostat: Use $(CURDIR) instead of $(PWD) and add support for O= option in Makefile',
    'sfc: Fix memcpy() with const destination compiler warning.',
    'altera tse: Fix network-delays and -retransmissions after high throughput.',
    'tomoyo: reduce mmap_sem hold for mm->exe_file'
];

// setExceptions modifies the config so we can have the tests pass
function setExceptions(msg) {
    var line = msg.split('\n')[0];
    var hasUrl = /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/i.test(msg.split('\n')[0]);
    var isMergeCommit = /^Merge branch/.test( line ) ||
    /^Merge tag/.test( line ) ||
    /^Merge [0-9a-f]+ into [0-9a-f]+/.test( line );
    var hasComponent = /^[^\n]+: [^\n]+/.test(line);

    if (hasUrl) {
        // Some commits can be pretty long
        cfg.titleMaxLineLength[0] = 100;
    }
    if (hasComponent || isMergeCommit) {
        // title (component) or body might start with lowercase
        cfg.capitalized[0] = false;
    }

    cfg.types = /^(l10n|sparc|Input|media-bus|tools\/power turbostat|parse-options\.h|Bluetooth|altera tse|drivers\/rtc\/rtc-s5m\.c):( [\w-.]+:)? /
}
function undoExceptions() {
    cfg = CommitMessage.prototype.config = clone(originalCfg);
}
function removeAllWarnings(message) {
    for (var i=0; i<message._errors.length; i++) {
        var e = message._errors[i];
        if (e.is(Error.WARNING)) {
            delete message._errors[i];
        }
    }
}

describe('external#github', function() {

    repos.forEach(function(repo) {
        describe(repo.repo, function() {
            this.timeout(8000);

            var ct = 0;
            var limit = repo.limit;
            var defaultLimit = 30;
            var path = util.format('/repos/%s/commits', repo.repo);
            var options = {
                hostname: 'api.github.com',
                path: path + '?page=1',
                headers: {
                    'User-Agent': 'clns/node-commit-msg',
                    'Accept': 'application/vnd.github.v3+json'
                }
            };
            var get = function(done) {
                https.get(options, function(res) {
                    assert.equal(res.statusCode, 200, 'Response: ' + JSON.stringify(res.headers));

                    var body = '';
                    res.on('data', function(chunk) {
                        body += chunk.toString();
                    });

                    res.on('end', function () {
                        var commits = JSON.parse(body);
                        commits.forEach(function(commit) {
                            ct++;
                            var c = commit.commit;
                            var msg = c.message;
                            var failMsg = 'Message was:\n' + msg;
                            var message;

                            if (repo.useExceptions) {
                                setExceptions(msg);
                                message = CommitMessage.parse(msg);
                                undoExceptions();

                                var isException = exceptions.indexOf(message._title) !== -1;
                                if (isException) {
                                    return;
                                }

                                // don't test warnings
                                removeAllWarnings(message);
                            } else {
                                message = CommitMessage.parse(msg);
                            }

                            assert.deepEqual(message._errors, [], failMsg);
                        });

                        if (ct >= limit || commits.length < defaultLimit) {
                            done();
                        } else {
                            options.path = path + '?page=' + (Math.ceil(ct / defaultLimit)+1);
                            get(done);
                        }
                    });
                });
            }; // get() function

            it(util.format('should validate all %d commit messages', limit), function(done) {
                get(done);
            });

        }); // describe repo
    }); // forEach repo
}); // describe external#github
