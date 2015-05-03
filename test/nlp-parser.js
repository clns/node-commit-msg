'use strict';

var assert = require('assert');
var util = require('util');
var Parser = require('../lib/nlp-parser');

describe('nlp-parser', function() {

    // Sentence: 'This patch will Add empty name check and changed email validation.'
    // Online parser: http://nlp.stanford.edu:8080/parser/index.jsp
    var wordsAndTags = 'This/DT patch/NN will/MD Add/VB empty/JJ name/NN check/NN and/CC changed/VBD email/NN validation/NN ./.';
    var pennArr = [
        '(ROOT',
        '  (S',
        '    (NP (DT This) (NN patch))',
        '    (VP',
        '      (VP (MD will)',
        '        (VP (VB Add)',
        '          (NP (JJ empty) (NN name) (NN check))))',
        '      (CC and)',
        '      (VP (VBD changed)',
        '        (NP (NN email) (NN validation))))',
        '    (. .)))'
        ];
    var pennParsed = Parser.newPennNode('ROOT', [
        Parser.newPennNode('S', [
            Parser.newPennNode('NP', [
                Parser.newPennNode('DT This', []),
                Parser.newPennNode('NN patch', [])
            ]),
            Parser.newPennNode('VP', [
                Parser.newPennNode('VP', [
                    Parser.newPennNode('MD will', []),
                    Parser.newPennNode('VP', [
                        Parser.newPennNode('VB Add', []),
                        Parser.newPennNode('NP', [
                            Parser.newPennNode('JJ empty', []),
                            Parser.newPennNode('NN name', []),
                            Parser.newPennNode('NN check', [])
                        ])
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
            ]),
            Parser.newPennNode('. .', [])
        ])
    ]);

    it('should parse penn correctly', function() {
        var instance = new Parser();
        instance.penn = pennArr.join('\n');
        assert.deepEqual(instance._penn, pennParsed);

        var instance2 = new Parser();
        instance2.penn = pennArr.join('\r\n');
        assert.deepEqual(instance2._penn, pennParsed);
    });

    it('should correctly use PennNode', function() {
        var instance = new Parser();
        instance.penn = pennArr.join('\n');
        var root = instance.penn;

        var got = root.getChildrenWithValue(/^S/)[0]
        .getChildrenWithValue(/^VP/)[0]
        .getChildrenWithValue(/^VP/)[1];
        var want = pennParsed.children[0].children[1].children[2];
        assert.deepEqual(got, want);
    });

    it('should parse sentences correctly', function() {
        this.timeout(5000); // allow enough time

        var sentences = [
           'Add empty name check and changed email validation.',
           'This patch will Add empty name check and changed email validation.',
           'CSS fixes for the profile page.',
           'This patch will CSS fixes for the profile page.',
           'Fixed bug in landing page.',
           'This patch will Fixed bug in landing page.',
           'Bug fixes when building target.'
        ];
        var instances = Parser.parseSentencesSync(sentences);
        assert.equal(instances[1]._wordsAndTags, wordsAndTags);
        assert.deepEqual(instances[1]._penn, pennParsed);
        assert(!instances[2].hasVerb(), 'Sentence "' + sentences[2] +
        '" has hasVerb===true while should be false');
        assert(instances[0].hasVerb(), 'Sentence "' + sentences[0] +
        '" has hasVerb===false while should be true');
    });

}); // describe nlp-parser
