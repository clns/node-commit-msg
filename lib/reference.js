'use strict';

var fs = require('fs');
var path = require('path');

module.exports = {
    parse: function(message, config) {
        var refs = [];
        var dir = path.join(__dirname, 'references');
        var references = fs.readdirSync(dir);
        references.forEach(function(n) {
            var ref = require(path.join(dir, n));
            refs = refs.concat(ref.parse(message, config));
        });
        return refs;
    }
};
