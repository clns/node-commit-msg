var config = require('./config');

/**
 * Commit message class
 *
 * @param {String} message The commit message to validate
 * @constructor
 */
function CommitMessage(message) {
    this._message = message;
}

Object.defineProperties(CommitMessage.prototype, {
    valid: {
        get: function() { return this._errors.length === 0; }
    },
    errorsAsString: {
        get: function() { return this._errors.join('\n'); }
    }
});

CommitMessage.prototype.validate = function() {
    this._errors = [];

    this._checkFormat();

    // var lines = this._message.split('\n');
    // for (var i=0; i<lines.length; i++) {
    //     this._checkFormatRules(i, lines[i]);
    // }

    return this;
}

CommitMessage.prototype._checkFormat = function() {
    var errors = this._errors;
    var format = new RegExp(
        // First line should be capitalized, contain only certain characters
        // and be <= config.titleMaxLength
        '^[A-Z][\w(), \'`\\-:]{0,'+(config.titleMaxLength-1)+'}' +
        '(' +
        // If more lines follow, enforce an empty line
        '\n\n' +
        // config.bodyMaxLength chars on each line, end with a newline,
        // unless it's the last line. Repeat at least once.
        '([^\n]{1,'+config.bodyMaxLength+'}\n?)+' +
        ')*$' // all of this is optional and repetitive
    );
    console.log(format);
    if (! format.test(this._message)) {
        errors.push('Commit message is not in the correct format. ' +
        'See https://github.com/clns/node-commit-msg/blob/master/CONTRIBUTING.md#commit-message');
    }
}

// Given a line number and a line, compare them against a set of
// rules. If it fails the errors array will be populated with error messages.
CommitMessage.prototype._checkFormatRules = function(lineNo, line) {
    var errors = this._errors;
    var realLineNo = lineNo + 1; // since it starts at 0
    var length = line.length;

    switch(lineNo) {
        case 0:
            if (length > config.titleMaxLength) {
                errors.push(util.format('First line should be no longer \
than %d characters, %d given.', config.titleMaxLength, length));
            }
            if (! /^[A-Z][\w(), '`\-:]+$/.test(line)) {
                errors.push('First line should be capitalized and can \
only contain the following: a-z A-Z 0-9 _ - () , `` \'\' :');
            }
            // TODO: check for present tense
            break;

        case 1:
            if (length !== 0) {
                errors.push('Second line should be empty.');
            }
            break;
        case 2:
            if (length === 0) {
                errors.push('Third line should not be empty.');
            }
        default:
            if (line[0] !== '#') {
                if (length > config.bodyMaxLength) {
                    errors.push(util.format('Line %d should be no longer than \
%d characters, %d given.', realLineNo, config.bodyMaxLength, length));
                }
            }
    }
}

module.exports = CommitMessage;
