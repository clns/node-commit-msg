'use strict';

var exec = require('child_process').exec;
var https = require('https');
var util = require('util');

// This class needs to implement the following:
// - static parse(message, config): <array of instances>
// - property match: <string>
// - isValid(cb): <boolean>
// - toString(): <string>

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
    var cfg = this._config ? this._config.references.github : undefined;
    var repo = this.repo;
    var user = this.user;
    var token;
    if (cfg) {
        user = user || cfg.user;
        repo = repo || cfg.repo;
        token = cfg.token;
    }
    var determineUserRepo = function(cb) {
        // Try to determine user/repo based on a remote that contains 'github.com'
        exec('git remote -v', {
            // encoding: 'utf8',
            stdio: [null]
        }, function(err, output) {
            if (err) return cb(err);

            var matches = output.match(/github\.com[/:]([^/]+)\/([\w-.]+)/m);
            if (matches) {
                user = user || matches[1];
                repo = repo || matches[2];
            }
            cb(null);
        });
    }
    var callApi = function() {
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
            if (res.statusCode === 404) {
                return cb(null, false); // invalid
            }
            if (res.statusCode < 300) {
                return cb(null, true); // valid
            }

            var body = '';
            res.on('data', function(chunk) {
                body += chunk.toString();
            });

            res.on('end', function () {
                var response = body ? JSON.parse(body) : false;

                console.log('warning: GitHub reference check failed with status code %d',
                    res.statusCode,
                    response && response.message ? ('; reason: ' + response.message) : '');

                cb(null, true); // consider valid
            });
        });
    }.bind(this);

    if (user && repo) {
        callApi();
    } else {
        determineUserRepo(function(err) {
            if (user && repo) {
                callApi();
            } else {
                cb(null, true); // cannot call the api if the user/repo couldn't be determined
            }
        });
    }
}

// Returns an array of Issue instances parsed according to
// https://help.github.com/articles/closing-issues-via-commit-messages/
Issue.parse = function(text, config) {
    var data = [];
    var cb = function(match, user, repo, issue) {
        data.push( new Issue(issue, repo, user, match, config) );
    };
    text.replace(/\b(?:(?:(?:close|resolve)[sd]?)|fix(?:e[sd])?) (?:(?:([a-z0-9](?:-?[a-z0-9])*)\/)?([\w-.]+))?#(\d+)\b/gi, cb);
    return data;
}

module.exports = Issue;
