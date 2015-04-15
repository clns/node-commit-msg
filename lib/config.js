/**
 * Commit message config class
 *
 * @constructor
 */
function Config() {
    var defaults = {
        titleMaxLength: 50,
        bodyMaxLength: 72
    };
    for (var i in defaults) {
        this[i] = defaults[i];
    }
}

module.exports = new Config();
