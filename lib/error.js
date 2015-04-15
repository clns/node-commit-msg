function Error(code, msg) {
    this.code = code;
    this.msg = msg;
}

Error.prototype.toString = function() {
    return this.msg;
}

module.exports = Error;
