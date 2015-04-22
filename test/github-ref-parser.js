'use strict';

var assert = require('assert');
var Issue = require('../lib/github-ref-parser').Issue;

describe('GHIssue', function() {

    it('should stringify correctly', function() {
        var i = new Issue('github', 'hub', 1);
        assert.equal(i.toString(), 'github/hub#1');
        i = new Issue(undefined, 'hub', 1);
        assert.equal(i.toString(), 'hub#1');
        i = new Issue(undefined, undefined, 1);
        assert.equal(i.toString(), '#1');
    });

    it('should parse correctly', function() {
        var issues = new Issue.parse('Commit with issue references\n\n' +
        'Resolve clns/node-commit-msg#1, and resolved #2 and resolves #11-3\n' +
        'Fix #45, fixed example-repo.git#34;\n' +
        'Close #74, fixes #45\n' +
        'This closes #34, closed #23, and closes example-user/example_repo.git#42.');

        assert.equal(issues[0].toString(), 'clns/node-commit-msg#1');
        assert.equal(issues[1].toString(), '#2');
        assert.equal(issues[2].toString(), '#11');
        assert.equal(issues[3].toString(), '#45');
        assert.equal(issues[4].toString(), 'example-repo.git#34');
        assert.equal(issues[5].toString(), '#74');
        assert.equal(issues[6].toString(), '#45');
        assert.equal(issues[7].toString(), '#34');
        assert.equal(issues[8].toString(), '#23');
        assert.equal(issues[9].toString(), 'example-user/example_repo.git#42');
    });

}); // end GHIssue
