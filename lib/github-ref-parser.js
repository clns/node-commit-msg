'use strict';

function Issue(user, repo, issue) {
    this.user = user;
    this.repo = repo;
    this.issue = issue;
}

Issue.prototype.toString = function() {
    var text = '#' + this.issue;
    if (this.repo !== undefined) {
        text = this.repo + text;

        if (this.user !== undefined) {
            text = this.user + '/' + text;
        }
    }
    return text;
}

// Returns an array of Issue instances parsed according to
// https://help.github.com/articles/closing-issues-via-commit-messages/
Issue.parse = function(text) {
    var data = [];
    var cb = function(all, user, repo, issue) {
        data.push( new Issue(user, repo, issue) );
    };
    text.replace(/\b(?:(?:(?:close|resolve)[sd]?)|fix(?:e[sd])?) (?:(?:([a-z0-9](?:-?[a-z0-9])*)\/)?([\w-\.]+))?#(\d+)\b/gi, cb);
    return data;
}

module.exports = {
    Issue: Issue
};
