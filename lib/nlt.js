'use strict';

var natural = require('natural');

var t = 'Changes profile picture delete feature';

natural.PorterStemmer.attach();
var stemmed = t.tokenizeAndStem();
stemmed.join(' ');
if (stemmed != t) {
    warn(util.format('Stemmed first line is different,\n' +
    'got "%s"\n' +
    'expect "%s"', t, stemmed));
}
