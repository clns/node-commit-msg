'use strict';

var execSync = require('child_process').execSync;
var https = require('https');
var util = require('util');

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

Issue.prototype.isValid = function(cb) {
    return cb(null, true); // todo: remove this line
    var cfg = this._config;
    var repo = this.repo;
    var user = this.user;
    var token;
    if (cfg.references.github) {
        repo = cfg.references.github.repo || repo;
        user = cfg.references.github.user || user;
        token = cfg.references.github.token;
    }
    var repoAndUserExist = function() {
        if ( !(repo && user) ) {
            var output = execSync('git remote -v', {
                // encoding: 'utf8',
                stdio: [null]
            });
            var matches = output.match(/github\.com(?:\/|:)([^/]+)\/([^/.]+)/g);
            if (matches) {
                user = user || matches[1];
                repo = repo || matches[2];
            }
        }
        return repo && user;
    }
    if ( cfg.references.github === false || !repoAndUserExist() ) {
        // If GitHub is specifically disabled, or user/repo could not be determined
        return cb(null, true);
    }

    // We have a user/repo, contact the API
    var options = {
        hostname: 'api.github.com',
        path: util.format('/repos/%s/%s/issues/%d', user, repo, this.issue),
        headers: {
            'User-Agent': 'clns/node-commit-msg',
            'Accept': 'application/vnd.github.v3+json'
        }
    };
    if (token) {
        options.headers.Authorization = 'token ' + token;
    }
    https.get(options, function(res) {
        if (res.headers && res.headers['x-ratelimit-remaining'] && program.verbose) {
            console.log('X-Ratelimit-Remaining: %d / %d',
            res.headers['x-ratelimit-remaining'],
            res.headers['x-ratelimit-limit']);
        }
        if (res.statusCode !== 200) {
            cb(new Error(res.statusMessage));
            return;
        }

        var body = '';
        res.on('data', function(chunk) {
            body += chunk.toString();
        });

        res.on('end', function () {
            var commits = JSON.parse(body);

            commits.every(function(record) {
                cb(null, record.commit.message);
                return ++ct < limit;
            });

            if (!(ct >= limit || commits.length < defaultLimit)) {
                options.path = path + '?page=' + (Math.ceil(ct / defaultLimit)+1);
                get();
            } else {
                finish();
            }
        });
    });
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
