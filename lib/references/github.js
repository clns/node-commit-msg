'use strict';

// This class needs to implement the following:
// - static parse(message, config): <array of instances>
// - property match: <string>
// - isValid(): <boolean>

function Issue(issue, repo, user, match, config) {
    this.issue = issue;
    this.repo = repo;
    this.user = user;
    this.match = match;
    this._config = config;
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

Issue.prototype.isValid = function() {
    return true;
}

// Returns an array of Issue instances parsed according to
// https://help.github.com/articles/closing-issues-via-commit-messages/
Issue.parse = function(text, config) {
    var data = [];
    var cb = function(match, user, repo, issue) {
        data.push( new Issue(issue, repo, user, match, config) );
    };
    text.replace(/\b(?:(?:(?:close|resolve)[sd]?)|fix(?:e[sd])?) (?:(?:([a-z0-9](?:-?[a-z0-9])*)\/)?([\w-\.]+))?#(\d+)\b/gi, cb);
    return data;
}

module.exports = Issue;
