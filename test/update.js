'use strict';

// Tests the 'update' hook

var assert = require('assert');
var execSync = require('child_process').execSync;
var g = require('./global-hooks');

describe('update', function() {
    this.timeout(8000); // allow enough time

    it('should reject the push for master and hotfix', function() {

        assert.throws(
            function() {
                console.log(execSync(
                    'git push --all',
                    {cwd: g.clone3, stdio: [null], encoding:'utf8'}
                ));
            },
            null,
            'Needs \'setup\' test suite to run before this'
        );

        var validCommit = 'Add file on the feature branch';
        assert(
            execSync(
                'git rev-list --all --grep="'+validCommit+'"',
                {cwd: g.origin, encoding: 'utf8', stdio: [null]}
            ),
            'Needs \'setup\' test suite to run before this'
        );

    });

});
