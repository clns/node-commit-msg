'use strict';

function Issue(issue, repo, user, match) {
    this.issue = issue;
    this.repo = repo; // optional
    this.user = user; // optional
    this.match = match; // optional
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
    var cb = function(match, user, repo, issue) {
        data.push( new Issue(issue, repo, user, match) );
    };
    text.replace(/\b(?:(?:(?:close|resolve)[sd]?)|fix(?:e[sd])?) (?:(?:([a-z0-9](?:-?[a-z0-9])*)\/)?([\w-\.]+))?#(\d+)\b/gi, cb);
    return data;
}

module.exports = {
    Issue: Issue
};
