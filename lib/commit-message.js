'use strict';

var fs = require('fs');
var util = require('util');
var semver = require('semver');
var Error = require('./error');

var config = {
    // first line should not start with \n, be 1 <= length
    // the optional body should be separated from title by exactly \n\n
    // only 1 \n is allowed at the end of the message.
    // capturing blocks: $1 - title, $2 - body
    // (\n\n between title and body and last \n, if any, are discarded)
    pattern: [/^([^\n]+)(?:\n\n([^\n][\S\s]*[^\n]))?\n?$/, Error.ERROR],
    capitalized: [true, Error.ERROR],
    invalidCharsInTitle: [/[^\w(), '"`\-:\./~\[\]*$=]/, Error.ERROR],
    titleMaxLineLength: [50, Error.ERROR],
    bodyMaxLineLength: [72, Error.WARNING],
    naturalWordsInTitle: [true, Error.ERROR]
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

    if (!isSemver && cfg.capitalized[0] && !/^[A-Z]/.test(t)) {
        log('Commit message should start with a capitalized letter',
        cfg.capitalized[1], [1, 1]);
    }

    if (t.length > cfg.titleMaxLineLength[0]) {
        log(util.format('First line (summary) should not exceed %d characters',
        cfg.titleMaxLineLength[0]), cfg.titleMaxLineLength[1],
        [1, cfg.titleMaxLineLength[0]]);
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

    if (cfg.naturalWordsInTitle[0]) {
        // TODO
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
