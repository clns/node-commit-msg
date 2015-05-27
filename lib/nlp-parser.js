'use strict';

//
// This is a wrapper for the Stanford Parser
// http://nlp.stanford.edu/software/lex-parser.shtml
//
// It parses 'wordsAndTags' and 'penn' formats.
//
// To parse stuff the following command can be used from the
// ./parser directory:
//
//     $ cd ./parser
//     $ java -mx200m -cp "parser.jar" \
//     edu.stanford.nlp.parser.lexparser.LexicalizedParser \
//     -outputFormat "wordsAndTags,penn" \
//     commit-msgs.ser.gz ../test/resources/commit-msgs.txt
//
// Online demo can be accessed at:
// http://nlp.stanford.edu:8080/parser/index.jsp
//

var os = require('os');
var path = require('path');
var fs = require('fs');
var execSync = require('child_process').execSync;
var java = null;
try { java = require('java'); } catch(e) {}

var JAVA_OPTS = '-mx300m';
var OUTPUT_FORMAT = 'wordsAndTags,penn';
var PARSER_PATH = path.resolve(__dirname, '../parser');
var PARSER = 'parser.jar';
var MODEL = 'commit-msgs.ser.gz';

function StanfordParser() {

}

Object.defineProperties(StanfordParser.prototype, {
    wordsAndTags: {
        set: function(raw) {
            this._wordsAndTags = raw;
        }
    },
    penn: {
        get: function() { return this._penn; },
        set: function(raw) {
            this._penn = parsePenn(raw);
        }
    }
});

// Returns true if at least one verb exists in the sentence
StanfordParser.prototype.hasVerb = function() {
    return /\S\/VB/.test(this._wordsAndTags);
}

StanfordParser.parseSentencesSync = function(sentences, separator) {
    var instances = [];
    var output;
    var parser;
    var separatorJS = typeof(separator) === 'undefined' || separator === 'newline' ? '\n' : separator;

    if (parser = StanfordParser.parser()) {
        // java is available, use it
        var res = [];
        sentences.forEach(function(sentence) {
            var tree = parser.parseSync(sentence);
            var tokens = tree.taggedYieldSync();
            var it = tokens.iteratorSync();
            var tagging = [];
            while (it.hasNextSync()) {
                var token = it.nextSync();
                tagging.push(token.toStringSync());
            }
            res.push([tagging.join(' ').trim(), tree.pennStringSync().trim()].join('\n\n'));
        });
        output = res.join('\n\n');
    } else {
        // use the java command instead
        var tmpfile = path.resolve(os.tmpdir(), 'nlp-parser-sentences.txt');
        var parserWd = PARSER_PATH;

        // Create a temp file containing the given sentences
        var fd = fs.openSync(tmpfile, 'w');
        fs.writeSync(fd, sentences.join(separatorJS));
        fs.closeSync(fd);

        var cmd = 'java ' + JAVA_OPTS +
            ' -cp "' + PARSER + '" ' +
            'edu.stanford.nlp.parser.lexparser.LexicalizedParser ' +
            '-outputFormat "' + OUTPUT_FORMAT + '" ' +
            (separator ? ('-sentences "'+separator+'" ') : '') +
            MODEL + ' ' + tmpfile;

        try {
            output = execSync(cmd, {
                cwd: parserWd,
                encoding: 'utf8',
                stdio: [null]
            });
        } catch(e) {
            fs.unlinkSync(tmpfile); // delete temp file
            throw e;
        }
        fs.unlinkSync(tmpfile); // delete temp file
    }

    // Output is separated by two line breaks
    // wordsAndTags is first, penn is second
    output = output.trim().split(/\r?\n\r?\n/);

    var formats = OUTPUT_FORMAT.split(',');
    var length = output.length;

    for (var i=0; i<length; ) {
        var instance = new StanfordParser();

        formats.forEach(function(format) {
            instance[format] = output[i++];
        });

        instances.push(instance);
    }

    return instances;
}

StanfordParser.parser = function() {
    if (java && !StanfordParser._parser) {
        java.classpath.push(path.join(PARSER_PATH, PARSER));

        // Redirect stderr to prevent the 'Loading parser from serialized file ...' msg
        var stderr = java.getStaticFieldValue("java.lang.System", "err");
        var fakeStderr = java.newInstanceSync("java.io.PrintStream", "/dev/null");
        java.callStaticMethodSync("java.lang.System", "setErr", fakeStderr);

        StanfordParser._parser = java.callStaticMethodSync(
            'edu.stanford.nlp.parser.lexparser.LexicalizedParser',
            'loadModel',
            path.join(PARSER_PATH, MODEL)
        );

        java.callStaticMethodSync("java.lang.System", "setErr", stderr);
    }
    return StanfordParser._parser;
}

function parsePenn(string) {
    var penn = new PennNode(null, []);
    var stack = [];
    var length = string.length;
    var node = '';
    var bracket = 1;
    for (var i=1; i<length; i++) {
        if (string[i] == '(') {
            bracket += 1;
            var matchIndex = getMatchingParenthesis(string, i);
            penn.children = penn.children.concat([ parsePenn( string.slice(i, matchIndex + 1) ) ]);
            i = matchIndex - 1;
        } else if (string[i] == ')') {
            bracket -= 1;
            penn._value = node.trim();
        } else {
            node += string[i];
        }
        if (bracket == 0) {
            return penn;
        }
    }
    return penn;
}

// Find the position of a matching closing bracket for a string opening bracket
function getMatchingParenthesis(string, startPos) {
    var length = string.length;
    var bracket = 1;
    for (var i=startPos+1; i<=length; i++) {
        if (string[i] == '(') {
            bracket += 1;
        } else if (string[i] == ')') {
            bracket -= 1;
        }
        if (bracket == 0) {
            return i;
        }
    }
}

function PennNode(value, children) {
    this._value = value;
    this.children = children;
}

Object.defineProperties(PennNode.prototype, {
    value: {
        get: function() { return this._value; }
    },
    children: {
        get: function() { return this._children; },
        set: function(v) {
            this._children = v;
            v.forEach(function(child) {
                child.parent = this;
            }, this);
        }
    }
});

PennNode.prototype.getChildrenWithValue = function(value) {
    var children = [];
    this.children.forEach(function(child) {
        if (value.test(child._value)) {
            children.push(child);
        }
    });
    return children;
};

PennNode.prototype.getHighestLevelNodesWithValue = function(value) {
    return getHighestLevelNodesWithValue(value, [this]);
}

function getHighestLevelNodesWithValue(value, nodes) {
    if (!nodes.length) {
        return [];
    }
    var children = [];
    for (var i=0; i<nodes.length; i++) {
        var node = nodes[i];
        var verbs = node.getChildrenWithValue(value);
        if (verbs.length) {
            return verbs;
        }
        children = children.concat(node.children);
    }
    return getHighestLevelNodesWithValue(value, children);
}

// Designated initializer for PennNodes
StanfordParser.newPennNode = function(value, children) {
    return new PennNode(value, children);
}

module.exports = StanfordParser;
