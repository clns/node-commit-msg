'use strict';

var assert = require('assert');
var util = require('util');
var Parser = require('../lib/nlp-parser');

describe('nlp-parser', function() {

    // Sentence: 'Add empty name check and changed email validation'
    var wordsAndTags = 'Add/VB empty/JJ name/NN check/NN and/CC changed/VBD email/NN validation/NN';
    var pennArr = [
        '(ROOT',
        '  (S',
        '    (VP',
        '      (VP (VB Add)',
        '        (NP (JJ empty) (NN name) (NN check)))',
        '      (CC and)',
        '      (VP (VBD changed)',
        '        (NP (NN email) (NN validation))))))'
        ];
    var pennParsed = Parser.newPennNode('ROOT', [
        Parser.newPennNode('S', [
            Parser.newPennNode('VP', [
                Parser.newPennNode('VP', [
                    Parser.newPennNode('VB Add', []),
                    Parser.newPennNode('NP', [
                        Parser.newPennNode('JJ empty', []),
                        Parser.newPennNode('NN name', []),
                        Parser.newPennNode('NN check', [])
                    ])
                ]),
                Parser.newPennNode('CC and', []),
                Parser.newPennNode('VP', [
                    Parser.newPennNode('VBD changed', []),
                    Parser.newPennNode('NP', [
                        Parser.newPennNode('NN email', []),
                        Parser.newPennNode('NN validation', [])
                    ])
                ])
            ])
        ])
    ]);

    it('should parse penn correctly', function() {
        var instance = new Parser();
        instance.penn = pennArr.join('\n');
        var instance2 = new Parser();
        instance2.penn = pennArr.join('\r\n');

        assert.deepEqual(removeCircularRefs(instance._penn), removeCircularRefs(pennParsed));
        assert.deepEqual(removeCircularRefs(instance2._penn), removeCircularRefs(pennParsed));
    });

    it('should correctly use PennNode', function() {
        var instance = new Parser();
        instance.penn = pennArr.join('\n');
        var root = instance.penn;
        var got = root.getChildrenWithValue(/^S/)[0]
        .getChildrenWithValue(/^VP/)[0]
        .getChildrenWithValue(/^VP/)[1];
        var want = pennParsed.children[0].children[0].children[2];

        assert.deepEqual(removeCircularRefs(got), removeCircularRefs(want));

        got = root.getChildrenWithValue(/^S/)[0]
        .getChildrenWithValue(/^VP/)[0]
        .getChildrenWithValue(/^VP/)[1]
        .getHighestLevelNodesWithValue(/^VB/)[0];
        want = want.children[0];

        assert.deepEqual(removeCircularRefs(got), removeCircularRefs(want));
    });

    it('should parse sentences correctly', function() {
        this.timeout(5000); // allow enough time

        var sentences = [
           'Add empty name check and changed email validation',
           'CSS fixes for the profile page',
           'Fixed bug in landing page',
           'Bug fixes when building target'
        ];
        var instances = Parser.parseSentencesSync(sentences, 'newline');

        assert.equal(instances[0]._wordsAndTags, wordsAndTags);
        assert.deepEqual(removeCircularRefs(instances[0]._penn), removeCircularRefs(pennParsed));
        assert(!instances[1].hasVerb(), 'Sentence "' + instances[1]._wordsAndTags +
        '" has hasVerb===true while should be false');
        assert(instances[2].hasVerb(), 'Sentence "' + instances[2]._wordsAndTags +
        '" has hasVerb===false while should be true');
    });

    it('should work without node-java', function() {
        this.timeout(5000); // allow enough time on Travis

        var sentences = [
           'CSS fixes',
           'Fix home page styling'
        ];
        var parserFn = Parser.parser;
        Parser.parser = function() { return false; }
        var instances = Parser.parseSentencesSync(sentences, 'newline');
        Parser.parser = parserFn;

        assert.equal(instances[0]._wordsAndTags, 'CSS/NNP fixes/NNS');
        assert.deepEqual(removeCircularRefs(instances[1].penn), removeCircularRefs(
            Parser.newPennNode('ROOT', [
                Parser.newPennNode('S', [
                    Parser.newPennNode('VP', [
                        Parser.newPennNode('VB Fix', []),
                        Parser.newPennNode('NP', [
                            Parser.newPennNode('NN home', []),
                            Parser.newPennNode('NN page', []),
                            Parser.newPennNode('NN styling', [])
                        ])
                    ])
                ])
            ]))
        );
    });

}); // describe nlp-parser

function removeCircularRefs(obj) {
    var circularRefs = ['parent'];
    for (var i in obj) {
        if (circularRefs.indexOf(i) !== -1) {
            delete obj[i];
        }
        if (obj.hasOwnProperty(i) && typeof(obj[i]) == 'object') {
            removeCircularRefs(obj[i]);
        }
    }
}
