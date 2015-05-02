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
    var pennParsed = {
        parent: 'ROOT',
        children: [
            {
                parent: 'S',
                children: [
                    {
                        parent: 'NP',
                        children: [
                            {
                                parent: 'DT This',
                                children: []
                            },
                            {
                                parent: 'NN patch',
                                children: []
                            }
                        ]
                    },
                    {
                        parent: 'VP',
                        children: [
                            {
                                parent: 'VP',
                                children: [
                                    {
                                        parent: 'MD will',
                                        children: []
                                    },
                                    {
                                        parent: 'VP',
                                        children: [
                                            {
                                                parent: 'VB Add',
                                                children: []
                                            },
                                            {
                                                parent: 'NP',
                                                children: [
                                                    {
                                                        parent: 'JJ empty',
                                                        children: []
                                                    },
                                                    {
                                                        parent: 'NN name',
                                                        children: []
                                                    },
                                                    {
                                                        parent: 'NN check',
                                                        children: []
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            },
                            {
                                parent: 'CC and',
                                children: []
                            },
                            {
                                parent: 'VP',
                                children: [
                                    {
                                        parent: 'VBD changed',
                                        children: []
                                    },
                                    {
                                        parent: 'NP',
                                        children: [
                                            {
                                                parent: 'NN email',
                                                children: []
                                            },
                                            {
                                                parent: 'NN validation',
                                                children: []
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        parent: '. .',
                        children: []
                    }
                ]
            }
        ]
    };

    it('should parse penn correctly', function() {
        var instance = new Parser();
        instance.penn = pennArr.join('\n');
        assert.deepEqual(instance._penn, pennParsed);

        var instance2 = new Parser();
        instance2.penn = pennArr.join('\r\n');
        assert.deepEqual(instance2._penn, pennParsed);
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
