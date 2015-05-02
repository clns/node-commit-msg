'use strict';

//
// This is a wrapper for the Stanford Parser
// http://nlp.stanford.edu/software/lex-parser.shtml
//
// It parses 'wordsAndTags' and 'penn' formats.
//
// To parse stuff the following command can be used from the
// ./external/stanford-parser directory:
//
//     $ java -mx200m -cp "stanford-parser.jar" \
//     edu.stanford.nlp.parser.lexparser.LexicalizedParser \
//     -outputFormat "wordsAndTags,penn" \
//     models/englishPCFG.caseless.ser.gz <INPUT-FILE>
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
    var parserWd = path.resolve(__dirname, '../external/stanford-parser');

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
    var penn = {'parent': null, 'children': []};
    var stack = [];
    var length = string.length;
    var node = '';
    var bracket = 1;
    for (var i=1; i<length; i++) {
        if (string[i] == '(') {
            bracket += 1;
            var matchIndex = getMatchingParenthesis(string, i);
            penn['children'].push( parsePenn( string.slice(i, matchIndex + 1) ) );
            i = matchIndex - 1;
        } else if (string[i] == ')') {
            bracket -= 1;
            penn['parent'] = node.trim();
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

module.exports = StanfordParser;