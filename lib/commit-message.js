'use strict';

var fs = require('fs');
var util = require('util');
var semver = require('semver');
var Error = require('./error');
var GHIssue = require('./github-ref-parser').Issue;

var config = {
    // first line should not start with \n, be 1 <= length
    // the optional body should be separated from title by exactly \n\n
    // only 1 \n is allowed at the end of the message.
    // capturing blocks: $1 - title, $2 - body
    // (\n\n between title and body and last \n, if any, are discarded)
    pattern: [/^([^\n]+)(?:\n\n([^\n][\S\s]*[^\n]))?\n?$/, Error.ERROR],
    capitalized: [true, Error.ERROR],
    invalidCharsInTitle: [/[^\w(), '"`\-:\./~\[\]*$={}]/, Error.ERROR],
    titlePreferredMaxLineLength: [50, Error.WARNING],
    titleMaxLineLength: [70, Error.ERROR],  // because GitHub adds an ellipsis after 70
    bodyMaxLineLength: [72, Error.WARNING],
    // specify the types/components that can prefix the commit message
    // the type  will be removed from the title before all the other validations
    // eg: perf: Speed up page load
    // eg: fix: i18n: Change login button text for spanish
    // Note that this is not an array as the others
    types: /^(fix|docs|feature|security|chore|refactor|test|config|perf|WIP):( [\w-]+:)? /,
    // validate GitHub issues location - should be placed in the last paragraph
    // of the body
    ghIssuesLocation: [true, Error.WARNING],
    // basic detection of imperative, present tense
    // http://regexr.com/3as25
    imperative: [new RegExp('^((fix|refactor|chang|updat|remov|releas|clos|' +
    'merg|rebas|mov|improv|includ|renam|us|finish|styl|hard.?cod|allow|' +
    'polish)(es|ed|ing))|((add|open|clean|correct|adjust|show|import|tweak' +
    ')(s|ed|ing))|(modified|modifies|modifying)|(stripped|strips|stripping)|' +
    '(makes|made|making)|(hides|hiding)|(misspelled|misspelling)|' +
    '(gets|got|getting)', 'i'), Error.WARNING]
};

/**
 * Commit message class
 *
 * @param {String} message The commit message
 * @constructor
 */
function CommitMessage(message) {
    this._errors = [];

    var cfg = this.config;
    var log = this._log.bind(this);

    if (!cfg.pattern[0].test(message)) {
        log('Commit message is not in the correct format, see\n' +
        'https://github.com/clns/node-commit-msg/blob/master/CONTRIBUTING.md#commit-message',
        cfg.pattern[1]);
        return; // can't continue past this point
    }

    var matches = message.match(cfg.pattern[0]);
    var t = this._title = matches[1];
    var b = this._body = matches[2];

    var isSemver = semver.valid(t);
    var index;
    var hasType = cfg.types.test(t);
    if (hasType) {
        t = t.replace(cfg.types, '');
    }
    var ghIssues;
    function getGHIssues() {
        if (ghIssues === undefined) {
            ghIssues = GHIssue.parse(message);
        }
        return ghIssues;
    }

    if (!isSemver && cfg.capitalized[0] && !/^[A-Z]/.test(t)) {
        log('Commit message should start with a capitalized letter',
        cfg.capitalized[1], [1, 1]);
    }

    if (t.length > cfg.titleMaxLineLength[0]) {
        log(util.format('First line (summary) should not exceed %d characters',
        cfg.titleMaxLineLength[0]), cfg.titleMaxLineLength[1],
        [1, cfg.titleMaxLineLength[0]]);
    } else if (t.length > cfg.titlePreferredMaxLineLength[0]) {
        log(util.format('First line (summary) should not exceed %d characters',
        cfg.titlePreferredMaxLineLength[0]), cfg.titlePreferredMaxLineLength[1],
        [1, cfg.titlePreferredMaxLineLength[0]]);
    }

    if ((index = t.search(/\s\s/)) !== -1) {
        log('First line (summary) contains invalid whitespace',
        Error.ERROR, [1, index+1]);
    }

    if (/[\.\s]$/.test(t)) {
        log('First line (summary) should not end with a period or whitespace',
        Error.ERROR, [1, t.length]);
    }

    if (cfg.invalidCharsInTitle[0] && (index = t.search(cfg.invalidCharsInTitle[0])) !== -1) {
        log('First line (summary) contains invalid characters',
        cfg.invalidCharsInTitle[1], [1, index+1]);
    }

    if (cfg.imperative[0] && (index = t.search(cfg.imperative[0])) !== -1) {
        log('Use imperative present tense, eg. "Fix bug" not ' +
        '"Fixed bug" or "Fixes bug". To get it right ask yourself: "If applied, ' +
        'this patch will <YOUR-COMMIT-MESSAGE-HERE>"', cfg.imperative[1], [1, index+1]);
    }

    if (cfg.ghIssuesLocation[0] && getGHIssues().length) {
        var firstIssue = ghIssues[ghIssues.length-1].toString();
        var totalParagraphs = message.match(/\n\n/g);
        var p = new RegExp(firstIssue + '.*\n\n');
        if (p.test(message)) {
            var lineIndex;
            message.split('\n').every(function(line, idx) {
                if ((index = line.indexOf(firstIssue)) !== -1) {
                    lineIndex = idx;
                    return false;
                }
                return true;
            });
            log('Issue references should be placed in the last paragraph of the body',
            cfg.ghIssuesLocation[1], [lineIndex+1, index+1]);
        }
    }

    if (b) {
        if (cfg.capitalized[0] && !/^[A-Z]/.test(b)) {
            log('Body should start with a capitalized letter',
            cfg.capitalized[1], [3, 1]);
        }
        var max;
        if (max = cfg.bodyMaxLineLength[0]) {
            var lines = b.split(/\n/);
            var longer = [];
            for (var i=0; i<lines.length; i++) {
                var line = lines[i];
                if (line.length > max) {
                    longer.push(i+1);
                }
            }
            var c;
            if (c = longer.length) {
                if (c <= 3) {
                    log(util.format('Lines %s in the commit body are ' +
                    'longer than %d characters. Body lines should ' +
                    'not exceed %d characters, except for compiler error ' +
                    'messages or other "non-prose" explanation'
                    , longer.join(', '), max, max), cfg.bodyMaxLineLength[1],
                    [longer[0]+2, max]);
                } else {
                    log(util.format('There are %d lines in the commit body ' +
                    'that are longer than %d characters. Body lines should ' +
                    'not exceed %d characters, except for compiler error ' +
                    'messages or other "non-prose" explanation'
                    , c, max, max), cfg.bodyMaxLineLength[1],
                    [longer[0]+2, max]);
                }
            }
        }
    }
}

Object.defineProperties(CommitMessage.prototype, {
    formattedMessages: {
        get: function() {
            var msgs = [];
            this._errors.forEach(function(e) { msgs.push(e.toFormattedString()); });
            return msgs.join( "\n" );
        }
    }
});

CommitMessage.prototype.config = config;

CommitMessage.prototype.hasErrors = function() {
    return !this._errors.every(function(e) { return !e.is(Error.ERROR); });
}

CommitMessage.prototype.hasWarnings = function() {
    return !this._errors.every(function(e) { return !e.is(Error.WARNING); });
}

CommitMessage.parseFromFile = function(file) {
    var msg = fs.readFileSync(file, { encoding: 'utf8' });
    return new CommitMessage(msg);
}

CommitMessage.parse = function(msg) {
    return new CommitMessage(msg);
}

// Helper method
CommitMessage.prototype._log = function(msg, type, location) {
    this._errors.push( new Error(msg, type, location) );
}

module.exports = CommitMessage;
