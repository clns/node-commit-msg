'use strict';

// You can create your own references and place them in this directory.
// Each reference should export a class that implements the following:
//
// - <Class>.parse()
// - <classInstance>.isValid()
// - <classInstance>.toString()
// - <classInstance>.match
// - (optional) <classInstance>.allowInSubject
// - (optional) <classInstance>.error
//
// See below for details.
//
// - <Class>.parse(text, config): <array of instances>
//
//   Static class that will be called to parse the given text and return
//   an array of class instances.
//
// - <classInstance>.isValid(callback)
//
//   Instance method that can be used to validate the ref against an
//   external API or anything else.
//
//   The 'callback' will be called with 2 arguments: 'err' and 'valid'.
//   'err' is an Error or null if no error, 'valid' is a boolean.
//
// - <classInstance>.toString(): <string>
//
//   Instance method used for displaying the ref in the error message.
//
// - <classInstance>.match: <string>
//
//   Property containing the entire matched string; eg. 'Closes #12' or
//   just '#12' if no specific keyword was given. This is useful for
//   pointing out the column where the error exists.
//
// - <classInstance>.allowInSubject: <boolean>
//
//   Optional property, set to true to allow references in the subject
//   (by default references should be placed only in body)
//
// - <classInstance>.error: <Error>
//
//   Optional property. If set, it will be used (its 'message') as
//   the error message that is sent to the user if a reference is invalid.
//   A possible use case is if you want to require the commit message
//   to include a reference, you would return a bogus class instance
//   from the parse() method that has the 'error' property set and isValid()
//   returns false.

var exec = require('child_process').exec;
var https = require('https');
var util = require('util');

function Issue(issue, repo, user, match, config) {
    this._issue = issue;
    this._repo = repo;
    this._user = user;
    this.match = match; // needs to be accessible from outside
    this._isPullRequest = /^pull[ -]request/.test(this.match);
    this._config = config;
}

Object.defineProperties(Issue.prototype, {
    allowInSubject: {
        get: function() {
            return this._isPullRequest;
        }
    }
});

Issue.prototype.toString = function() {
    var text = '#' + this._issue;
    if (this._repo !== undefined) {
        text = this._repo + text;

        if (this._user !== undefined) {
            text = this._user + '/' + text;
        }
    }
    return text;
}

Issue.prototype.isValid = function(cb) {
    var cfg = this._config ? this._config.references.github : undefined;
    var repo = this._repo;
    var user = this._user;
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
            path: util.format('/repos/%s/%s/issues/%d', user, repo, this._issue),
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

                console.error('warning: GitHub reference check failed with status code %d',
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
    var instances = [];
    var cb = function(match, user, repo, issue) {
        instances.push( new Issue(issue, repo, user, match, config) );
    };
    text.replace(config.references.github.pattern, cb);
    return instances;
}

module.exports = Issue;
