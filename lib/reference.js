'use strict';

var fs = require('fs');
var path = require('path');

module.exports = {
    parse: function(message, config, cb) {
        var dir = path.join(__dirname, 'references');
        fs.readdir(dir, function(err, files) {
            if (err) return cb(err);

            var refs = [];
            files.sort(function(a, b) {
                for (var i in config.references) {
                    if (config.references.hasOwnProperty(i)) {
                        if (i == path.basename(a, '.js')) return -1;
                        if (i == path.basename(b, '.js')) return 1;
                    }
                }
                return 0;
            });
            files.forEach(function(f) {
                // Maybe the reference was specifically disabled?
                if (config.references[path.basename(f, '.js')] !== false) {
                    var ref = require(path.join(dir, f));
                    refs = refs.concat(ref.parse(message, config));
                }
            });
            cb(null, refs);
        });
    }
};
