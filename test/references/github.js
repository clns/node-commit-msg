'use strict';

var assert = require('assert');
var Issue = require('../../lib/references/github');

describe('references/github', function() {

    it('should stringify correctly', function() {
        var i = new Issue(1, 'hub', 'github');
        assert.equal(i.toString(), 'github/hub#1');
        i = new Issue(1, 'hub');
        assert.equal(i.toString(), 'hub#1');
        i = new Issue(1);
        assert.equal(i.toString(), '#1');
    });

    it('should parse correctly', function() {
        var issues = new Issue.parse('Commit with issue references\n\n' +
        'Resolve clns/node-commit-msg#1, and resolved #2 and resolves #11-3\n' +
        'Fix #45, fixed example-repo.git#34;\n' +
        'Close #74, fixes #45\n' +
        'This closes #34, closed #23, and closes example-user/example_repo.git#42.');

        assert.equal(issues[0].toString(), 'clns/node-commit-msg#1');
        assert.equal(issues[0].match, 'Resolve clns/node-commit-msg#1');
        assert.equal(issues[1].toString(), '#2');
        assert.equal(issues[1].match, 'resolved #2');
        assert.equal(issues[2].toString(), '#11');
        assert.equal(issues[2].match, 'resolves #11');
        assert.equal(issues[3].toString(), '#45');
        assert.equal(issues[4].toString(), 'example-repo.git#34');
        assert.equal(issues[4].match, 'fixed example-repo.git#34');
        assert.equal(issues[5].toString(), '#74');
        assert.equal(issues[6].toString(), '#45');
        assert.equal(issues[7].toString(), '#34');
        assert.equal(issues[8].toString(), '#23');
        assert.equal(issues[9].toString(), 'example-user/example_repo.git#42');
        assert.equal(issues[9].match, 'closes example-user/example_repo.git#42');
    });

    it('should validate correctly using the API', function(done) {
        this.timeout(3000); // allow enough time

        var issues = new Issue.parse('Validate issue references using APIs\n\n' +
        'Resolve #99999 and resolves github/hub#11-3\n' +
        'Fix smooth-drawing#1.');
        var ct = 0;
        var isDone = function() {
            ct++;
            if (ct == issues.length) done();
        };
        var results = [false, true, true];

        results.forEach(function(val, idx) {
            issues[idx].isValid(function(err, valid) {
                assert.equal(valid, val, issues[idx].toString());
                isDone();
            });
        });
    });

}); // end GHIssue