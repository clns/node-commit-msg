'use strict';

// Just a basic Error class.

var chalk = require('chalk'); // for formatting

function Error(msg, type, location) {
    this.message = msg;
    this.type = type || Error.ERROR;
    this.line = location ? location[0] : undefined;
    this.column = location ? location[1] : undefined;
}

Error.ERROR = 'error';
Error.WARNING = 'warning';

Error.prototype.toString = function() {
    var prefix = this.type;
    if (this.line !== undefined) {
        prefix += ' (' + this.line;
        if (this.column !== undefined) {
            prefix += ',' + this.column;
        }
        prefix += ')';
    }
    return prefix + ': ' + this.message;
}

Error.prototype.toFormattedString = function() {
    return this.type == Error.WARNING ?
        chalk.yellow( this.toString() ) :
        chalk.red( this.toString() );
}

Error.prototype.is = function(type) {
    return this.type === type;
}

module.exports = Error;
