'use strict';

//
// This is a wrapper for the Stanford Parser
// http://nlp.stanford.edu/software/lex-parser.shtml
//
// It parses 'wordsAndTags' and 'penn' formats.
//
// To parse stuff the following command can be used from the
// ./vendor/stanford-parser directory:
//
//     $ cd ./vendor/stanford-parser
//     $ java -mx200m -cp "stanford-parser.jar" \
//     edu.stanford.nlp.parser.lexparser.LexicalizedParser \
//     -outputFormat "wordsAndTags,penn" \
//     models/englishPCFG.caseless.ser.gz ../../test/resources/commit-msgs.txt
//
// Online demo can be accessed at:
// http://nlp.stanford.edu:8080/parser/index.jsp
//

var os = require('os');
var path = require('path');
var fs = require('fs');
var execSync = require('child_process').execSync;

var javaOpts = '-mx200m';
var outputFormat = 'wordsAndTags,penn';
var parser = 'models/englishPCFG.caseless.ser.gz';

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

StanfordParser.parseSentencesSync = function(sentences) {
    var instances = [];
    var tmpfile = path.resolve(os.tmpdir(), 'nlp-parser-sentences.txt');
    var parserWd = path.resolve(__dirname, '../vendor/stanford-parser');

    // Create a temp file containing the given sentences
    var fd = fs.openSync(tmpfile, 'w');
    fs.writeSync(fd, sentences.join('\n'));
    fs.closeSync(fd);

    var cmd = 'java ' + javaOpts +
        ' -cp "stanford-parser.jar" ' +
        'edu.stanford.nlp.parser.lexparser.LexicalizedParser ' +
        '-outputFormat "' + outputFormat + '" ' +
        parser + ' ' + tmpfile;

    try {
        var output = execSync(cmd, {
            cwd: parserWd,
            encoding: 'utf8',
            stdio: [null]
        });
    } catch(e) {
        fs.unlinkSync(tmpfile); // delete temp file
        throw e;
    }
    fs.unlinkSync(tmpfile); // delete temp file

    // Output is separated by two line breaks
    // wordsAndTags is first, penn is second
    output = output.trim().split(/\r?\n\r?\n/);

    var formats = outputFormat.split(',');
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
