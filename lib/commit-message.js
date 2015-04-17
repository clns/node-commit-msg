'use strict';

var fs = require('fs');
var util = require('util');
var chalk = require('chalk'); // for formatting

var config = {
    // first line should not start with \n, be 1 <= length <= 50
    // the optional body should be separated from title by exactly \n\n
    // only 1 \n is allowed at the end of the message.
    // capturing blocks: $1 - title, $2 - body
    // (\n\n between title and body and last \n, if any, are discarded)
    pattern: /^([^\n]{1,50})(?:\n\n([^\n][\S\s]*[^\n]))?\n?$/,
    capitalized: true,
    allowedCharsInTitle: /^[\w(), '`\-:\.]*$/,
    preferredBodyMaxLineLength: 72,
    naturalWordsInTitle: true
};

/**
 * Commit message class
 *
 * @param {String} message The commit message
 * @constructor
 */
function CommitMessage(message) {
    this._errors = [];
    this._warnings = [];

    var cfg = config;
    var err = this._logError.bind(this);
    var warn = this._logWarning.bind(this);

    if (!cfg.pattern.test(message)) {
        err('Commit message is not in the correct format, see\n' +
        'https://github.com/clns/node-commit-msg/blob/master/CONTRIBUTING.md#commit-message');
        return; // can't continue past this point
    }

    var matches = message.match(cfg.pattern);
    var t = this._title = matches[1];
    var b = this._body = matches[2];

    if (cfg.capitalized) {
        if (!/^[A-Z]/.test(t)) {
            err('Commit message should start with a capitalized letter');
        }
        if (b && !/^[A-Z]/.test(b)) {
            err('Body should start with a capitalized letter');
        }
    }

    if (/\.$/.test(t)) {
        err('First line (summary) should not end with a period');
    }

    if (cfg.allowedCharsInTitle && !cfg.allowedCharsInTitle.test(t)) {
        err('First line (summary) contains invalid characters');
    }

    if (cfg.naturalWordsInTitle) {
        // TODO
    }

    if (b) {
        var max;
        if (max = cfg.preferredBodyMaxLineLength) {
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
                    warn(util.format('Lines %s in the commit body are ' +
                    'longer than %d characters. Body lines should ' +
                    'not exceed %d characters, except for compiler error ' +
                    'messages or other "non-prose" explanation'
                    , longer.join(', '), max, max));
                } else {
                    warn(util.format('There are %d lines in the commit body ' +
                    'that are longer than %d characters. Body lines should ' +
                    'not exceed %d characters, except for compiler error ' +
                    'messages or other "non-prose" explanation'
                    , c, max, max));
                }
            }
        }
    }
}

Object.defineProperties(CommitMessage.prototype, {
    valid: {
        get: function() { return this._errors.length === 0; }
    },
    hasWarnings: {
        get: function() { return this._warnings.length > 0; }
    },
    errors: {
        get: function() { return this._errors; }
    },
    warnings: {
        get: function() { return this._warnings; }
    },
    formattedErrors: {
        get: function() {
            return chalk.red( " - " + this._errors.join( "\n - " ) );
        }
    },
    formattedWarnings: {
        get: function() {
            return chalk.yellow( " - " + this._warnings.join( "\n - " ) );
        }
    }
});

CommitMessage.prototype.config = config;

CommitMessage.parseFromFile = function(file) {
    var msg = fs.readFileSync(file, { encoding: 'utf8' });
    return new CommitMessage(msg);
}

CommitMessage.parse = function(msg) {
    return new CommitMessage(msg);
}

CommitMessage.prototype._logError = function(msg) {
    this._errors.push(msg);
}

CommitMessage.prototype._logWarning = function(msg) {
    this._warnings.push(msg);
}

module.exports = CommitMessage;
