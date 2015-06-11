'use strict';

var path = require('path');
var fs = require('fs');
var util = require('util');
var semver = require('semver');
var Error = require('./error');
var Reference = require('./reference');
var Parser = require('./nlp-parser');
var Config = require('./config');

/**
 * Commit message class
 *
 * @param {String} message The commit message
 * @constructor
 */
function CommitMessage(message, config) {
    this._message = message.replace(/^#[\s\S]*/gm, "").trim(); // remove comments
    this._config = config;
}


// Properties

Object.defineProperties(CommitMessage.prototype, {
    message: {
        get: function() { return this._message; }
    },
    formattedMessages: {
        get: function() {
            var msgs = [];
            this._errors.forEach(function(e) { msgs.push(e.toFormattedString()); });
            return msgs.join( "\n" );
        }
    }
});


// Static methods (initializers)

CommitMessage.parse = function(message, config, cb) {
    if (!cb) {
        cb = config;
        config = undefined;
    }
    CommitMessage.resolveConfig(config, function(cfg) {
        var msg = new CommitMessage(message, Config( cfg ));
        msg.validate(cb);
    });
}

CommitMessage.parseFromFile = function(file, config, cb) {
    if (!cb) {
        cb = config;
        config = undefined;
    }
    fs.readFile(file, { encoding: 'utf8' }, function(err, msg) {
        if (err) {
            cb(err);
            return;
        };
        CommitMessage.parse(msg, config, cb);
    });
}

CommitMessage.Error = Error;
CommitMessage.Config = Config;

// Possible types for 'cfg': undefined, object, true, string.
// If undefined, it will use the default validations,
// if object, it will overwrite the default validations,
// if true or string it will search for the first package.json starting
// at the current dir (true) or the given path (string) and
// use the 'commitMsg' key from it, if any.
CommitMessage.resolveConfig = function(cfg, cb) {
    var getPackageJsonConfig = function(dir) {
        if (!dir) {
            return cb(false);
        }
        var file = path.resolve(dir, 'package.json');
        // check if exists, not with fs.exists() since it's deprecated
        fs.open(file, 'r', function(err, fd) {
            if (!err) {
                var pkg = require(file);
                cb(pkg.commitMsg);
                fs.close(fd);
            } else {
                var upDir = path.resolve(dir, '..');
                getPackageJsonConfig(upDir != dir ? upDir : null);
            }
        });
    }
    if (cfg && typeof(cfg) != 'object') {
        // try to find the first package.json file with a config
        getPackageJsonConfig(typeof(cfg) == 'string' ? cfg : __dirname);
    } else {
        cb(cfg);
    }
}

// See the async method above for details.
CommitMessage.resolveConfigSync = function(cfg) {
    if (cfg && typeof(cfg) != 'object') {
        var dir = typeof(cfg) == 'string' ? cfg : __dirname;
        while(dir) {
            var file = path.resolve(dir, 'package.json');
            try {
              if (fs.statSync(file).isFile()) {
                  var pkg = require(file);
                  return pkg.commitMsg;
              }
            } catch (e) {}
            var upDir = path.resolve(dir, '..');
            dir = upDir != dir ? upDir : null;
        }
        return false;
    }
    return cfg;
}


// Methods

CommitMessage.prototype.validate = function(cb) {
    this._errors = [];

    var cfg = this._config;
    var message = this._message;

    if (cfg.disable) {
        return cb(null, this); // validation is disabled
    }

    if (!message.length) {
        this._title = '';
        return cb(null, this); // empty commit messages are allowed
    }

    if (!cfg.pattern.test(message)) {
        this._log('Commit message is not in the correct format; subject (first line) ' +
        'and body should be separated by one empty line',
        Error.ERROR);
        return cb(null, this); // can't continue past this point
    }

    var matches = message.match(cfg.pattern);
    var t = this._title = matches[1];
    var b = this._body = matches[2];

    if (cfg.types) {
        t = t.replace(cfg.types.allowedTypes, '');
    }
    this._isSemver = semver.valid(t);
    if (typeof(b) === 'string') {
        b = b.replace(/^#[\s\S]*/gm, "").trim(); // remove comments
    }

    // Validations

    t = this._checkStrictTypes(t);
    this._colOffset = this._title.length - t.length;
    this._checkCapitalLetter(t);
    this._checkLength();
    this._checkWhitespace(t);
    this._checkEnding(t);
    this._checkInvalidCharacters(t);
    this._checkReferences(function(err) {
        if (err) return cb(err);

        this._checkImperativeVerbs(t, function(err) {
            if (err) return cb(err);

            if (b) {
                this._checkLengthInBody(b);
            }

            cb(null, this); // finish
        }.bind(this));
    }.bind(this));
}

CommitMessage.prototype.hasErrors = function() {
    return !this._errors.every(function(e) { return !e.is(Error.ERROR); });
}

CommitMessage.prototype.hasWarnings = function() {
    return !this._errors.every(function(e) { return !e.is(Error.WARNING); });
}


// Private

CommitMessage.prototype._log = function(msg, type, location) {
    this._errors.push( new Error(msg, type, location) );
}

// Validation methods

CommitMessage.prototype._checkTypes = function() {
    var cfg = this._config;

    if (cfg.types && cfg.types.required && !cfg.types.allowedTypes.test(this._title)) {
        this._log('Commit subject should be prefixed by a type',
            cfg.types.type, [1, 1]);
    }
}

CommitMessage.prototype._checkStrictTypes = function(t) {
    var cfg = this._config;

    if (cfg.strictTypes && cfg.strictTypes.invalidTypes.test(t)) {
        this._log(util.format('Commit subject contains invalid type %s', t.match(cfg.strictTypes.invalidTypes)[1].trim()),
        cfg.strictTypes.type, [1, 1]);
        t = t.replace(cfg.strictTypes.invalidTypes, '');
    } else {
        // only check this if no invalid type was detected
        this._checkTypes();
    }
    return t;
}

CommitMessage.prototype._checkCapitalLetter = function(t) {
    var cfg = this._config;

    if (!this._isSemver && cfg.capitalized) {
        if (cfg.capitalized.capital && !/^[A-Z]/.test(t)) {
            this._log('Commit message should start with a capitalized letter',
                cfg.capitalized.type, [1, 1+this._colOffset]);
        } else if (!cfg.capitalized.capital && !/^[a-z]/.test(t)) {
            this._log('Commit message should start with a lowercase letter',
                cfg.capitalized.type, [1, 1+this._colOffset]);
        }
    }
}

CommitMessage.prototype._checkLength = function() {
    var cfg = this._config;
    var t = this._title;

    if (cfg.titleMaxLineLength && t.length > cfg.titleMaxLineLength.length) {
        this._log(util.format('Commit subject should not exceed %d characters',
        cfg.titleMaxLineLength.length), cfg.titleMaxLineLength.type,
        [1, cfg.titleMaxLineLength.length]);
    } else if (cfg.titlePreferredMaxLineLength && t.length > cfg.titlePreferredMaxLineLength.length) {
        this._log(util.format('Commit subject should not exceed %d characters',
        cfg.titlePreferredMaxLineLength.length), cfg.titlePreferredMaxLineLength.type,
        [1, cfg.titlePreferredMaxLineLength.length]);
    }
}

CommitMessage.prototype._checkLengthInBody = function(b) {
    var cfg = this._config;

    if (cfg.bodyMaxLineLength) {
        var max = cfg.bodyMaxLineLength.length;
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
                this._log(util.format('Lines %s in the commit body are ' +
                'longer than %d characters. Body lines should ' +
                'not exceed %d characters, except for compiler error ' +
                'messages or other "non-prose" explanation'
                , longer.join(', '), max, max), cfg.bodyMaxLineLength.type,
                [longer[0]+2, max]);
            } else {
                this._log(util.format('There are %d lines in the commit body ' +
                'that are longer than %d characters. Body lines should ' +
                'not exceed %d characters, except for compiler error ' +
                'messages or other "non-prose" explanation'
                , c, max, max), cfg.bodyMaxLineLength.type,
                [longer[0]+2, max]);
            }
        }
    }
}

CommitMessage.prototype._checkWhitespace = function(t) {
    var index;

    if ((index = t.search(/\s\s/)) !== -1) {
        this._log('Commit subject contains invalid whitespace',
        Error.ERROR, [1, index+1+this._colOffset]);
    }
}

CommitMessage.prototype._checkEnding = function(t) {
    if (/[\.\s]$/.test(t)) {
        this._log('Commit subject should not end with a period or whitespace',
        Error.ERROR, [1, t.length+this._colOffset]);
    }
}

CommitMessage.prototype._checkInvalidCharacters = function(t) {
    var cfg = this._config;
    var index;

    if (cfg.invalidCharsInTitle && (index = t.search(cfg.invalidCharsInTitle.invalidChars)) !== -1) {
        this._log('Commit subject contains invalid characters',
        cfg.invalidCharsInTitle.type, [1, index+1+this._colOffset]);
    }
}

CommitMessage.prototype._checkImperativeVerbs = function(t, cb) {
    var cfg = this._config;
    var index;

    if (cfg.imperativeVerbsInTitle && ( cfg.imperativeVerbsInTitle.alwaysCheck || !this.hasErrors() )) {

        Parser.parseSentences([t], function(err, parsers) {
            if (err) return cb(err, this);

            parsers.every(function(parser) {
                var hasError = false;
                if (!parser.isFragment() && parser.hasVerb()) {
                    // If the commit message is not a fragment and
                    // contains at least 1 verb, continue

                    var checkImperative = function(verb) {
                        var matches = verb.value.match(/^VB[^P\s]+ (\S+)$/);
                        if (matches) {
                            var index = t.indexOf(matches[1]);

                            this._log('Use imperative present tense, eg. "Fix bug" not ' +
                            '"Fixed bug" or "Fixes bug". To get it right ask yourself: "If applied, ' +
                            'this patch will <YOUR-COMMIT-MESSAGE-HERE>"',
                            cfg.imperativeVerbsInTitle.type, [1, index+1+this._colOffset]);

                            hasError = true;
                            return false; // stop loop
                        }
                        return true;
                    };

                    try {
                        var baseNode = parser.penn.getHighestLevelNodesWithValue(/^VBP?/)[0].parent.parent;
                    } catch(e) {}

                    // children of baseNode need to have the first verb in imperative mood
                    if (baseNode) {
                        baseNode.children.every(function(child) {
                            var verbs = child.getHighestLevelNodesWithValue(/^VB/);
                            return verbs.every(checkImperative, this);
                        }, this);
                    }
                }
                return !hasError;
            }, this);

            cb(null, this);
        }.bind(this));

        return;
    }
    cb(null, this);
}

CommitMessage.prototype._checkReferences = function(cb) {
    var cfg = this._config;
    var message = this._message;
    var index;

    if (cfg.references) {
        Reference.parse(message, cfg, function(err, refs) {
            if (err) return cb(err);

            var index = 0;
            var processRef = function() {
                var ref = refs[index];
                if (!ref) {
                    return cb(null, this); // done processing refs
                }

                // https://developer.mozilla.org/en/docs/Web/JavaScript/Guide/Regular_Expressions
                var escaped = ref.match.replace(/[.*+?^${}()|[\]\\\/]/g, "\\$&");
                var p = new RegExp('('+escaped+'.*\n\n|^[^\n]*'+escaped+')');
                var getLineIndex = function() {
                    var lineIndex;
                    message.split('\n').every(function(line, idx) {
                        if ((index = line.indexOf(ref.match)) !== -1) {
                            lineIndex = idx;
                            return false;
                        }
                        return true;
                    });
                    return lineIndex;
                }
                if (p.test(message)) {
                    this._log('References should be placed in the last paragraph of the body',
                    cfg.references.type, [getLineIndex()+1, index+1]);
                    return cb(null, this);
                }
                if (cfg.references.alwaysCheck !== 'never' && ( cfg.references.alwaysCheck || !this.hasErrors() )) {
                    // only access the API if no other errors detected or we must
                    ref.isValid(function(err, valid) {
                        if (err) return cb(err);

                        if (!valid) {
                            this._log(util.format('Reference %s is not valid', ref.toString()), cfg.references.type,
                            [getLineIndex()+1, index+1]);
                            return cb(null, this);
                        } else {
                            index++;
                            processRef();
                        }
                    }.bind(this));
                } else {
                    cb(null, this);
                }
            }.bind(this);

            processRef();
        }.bind(this));
        return;
    }
    cb(null, this);
}


module.exports = CommitMessage;
