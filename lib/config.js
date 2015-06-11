'use strict';

var Error = require('./error');
var clone = require('clone');

// Available config options. Any option can be disabled by setting the value
// to false if not otherwise noted.
var config = {
    // set this to true to disable the validation
    disable: false,
    // first line should not start with \n
    // the optional body should be separated from subject by exactly \n\n
    // capturing blocks: $1 - subject, $2 - body
    // (\n\n between subject and body and last \n, if any, are discarded)
    // this cannot be disabled, but you can change the pattern
    pattern: /^([^\n]+)(?:\n\n([^\n][\S\s]*[^\n]))?\n*$/,
    // if first letter of the subject should be capitalized or not
    capitalized: {capital: true, type: Error.ERROR},
    invalidCharsInSubject: {invalidChars: /[^\w(), '"`\-:\./~\[\]*$={}&;#+@<>%^]/, type: Error.ERROR},
    subjectPreferredMaxLineLength: {length: 50, type: Error.WARNING},
    subjectMaxLineLength: {length: 70, type: Error.ERROR},  // because GitHub adds an ellipsis after 70
    bodyMaxLineLength: {length: 72, type: Error.WARNING},
    // specify the types/components that can prefix the commit message
    // the type  will be removed from the subject for some validations
    // eg: perf: Speed up page load
    // eg: fix: i18n: Change login button text for spanish
    // if 'required' is true, the commit message is required to include it
    types: {
        allowedTypes: /^(fix|docs|feature|security|chore|refactor|test|config|perf|WIP):( [\w-.()]+:)? /,
        required: false,
        type: Error.ERROR
    },
    // remove any 'type: ' that precedes the commit message that is not valid
    // note that the pattern should be a capturing group
    // and should include the space also, as in 'i18n: '
    strictTypes: {invalidTypes: /(^[\w-.()]+:( [\w-.()]+:)? )/, type: Error.ERROR},
    // validate references; all refs should be placed in the last paragraph of the body
    // existing references can be found in lib/references/:
    // - GitHub https://help.github.com/articles/closing-issues-via-commit-messages/
    //   config:
    //     github: {user: <GitHub user>, repo: <the repo name>, token: <GitHub token>}
    //     * if token is not given, it will interogate the API anonymously
    // set 'alwaysCheck' to true to always run this validation;
    // default is false so the API check will only run if there are no other errors,
    // you should keep it like this for performance reasons;
    // there's also a third option 'never' that will disable the API check
    references: {
        alwaysCheck: false,
        type: Error.ERROR,
        github: {
            // possible keys: user, repo, token, pattern.
            // the only capturing groups should be:
            // 1 - user (optional); 2 - repo (optional); 3 - issue # (required)
            // should also match 'pull request' or 'pull-request'
            pattern: /(?:(?:(?:(?:close|resolve)[sd]?)|fix(?:e[sd])?|pull[ -]request) )?(?:(?:(?:([a-z0-9](?:-?[a-z0-9])*)\/)?([\w-.]+))?#|(?:\bgh-))(\d+)\b/gi
        }
    },
    // check for non-imperative verbs in the commit subject
    // set 'alwaysCheck' to true to always run this validation;
    // default is false so this check will only run if there are no other errors,
    // you should keep it like this for performance reasons
    imperativeVerbsInSubject: {alwaysCheck: false, type: Error.ERROR}
};

module.exports = function(cfg, defaultConfig) {
    var c = typeof(defaultConfig) === 'undefined' ? clone(config) : clone(defaultConfig);
    var overwrite = function(what, data) {
        if (data instanceof Object && !(data instanceof RegExp) && !(data instanceof Array)) {
            for (var i in data) {
                if (typeof(what[i]) == 'undefined') {
                    what[i] = {};
                }
                what[i] = overwrite(what[i], data[i]);
            }
        } else if (what instanceof RegExp && (typeof(data) == 'string' || data instanceof Array)) {
            what = typeof data == 'string' ? new RegExp(data) : new RegExp(data[0], data[1]);
        } else {
            what = data;
        }
        return what;
    }
    if (cfg) {
        // overwrite defaults
        for (var i in cfg) {
            if (cfg.hasOwnProperty(i) && typeof c[i] != 'undefined') {
                c[i] = overwrite(c[i], cfg[i]);
            }
        }
    }
    return c;
}
