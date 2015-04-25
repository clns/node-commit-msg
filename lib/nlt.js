'use strict';

var util = require('util');
var natural = require('natural');

var t = 'Changes profile picture in the main view';

// natural.PorterStemmer.attach();
// var stemmed = t.tokenizeAndStem();
// stemmed.join(' ');
// if (stemmed != t) {
//     console.warn(util.format('Stemmed first line is different,\n' +
//     'got "%s"\n' +
//     'expect "%s"', t, stemmed));
// }

// var SentenceAnalyzer = natural.SentenceAnalyzer;
// var PresentVerbInflector = natural.PresentVerbInflector;
// var wordnet = new natural.WordNet();
//
// wordnet.lookup('node', function(results) {
//     results.forEach(function(result) {
//         console.log('------------------------------------');
//         console.log(result.synsetOffset);
//         console.log(result.pos);
//         console.log(result.lemma);
//         console.log(result.synonyms);
//         console.log(result.pos);
//         console.log(result.gloss);
//     });
// });

// var speak = require("speakeasy-nlp");
var https = require('https');
var assert = require('assert');
var compendium = require('compendium-js');

var limit = 30;
var ct = 0;
var defaultLimit = 30;
var path = util.format('/repos/%s/commits', 'tpope/vim-pathogen');
var options = {
    hostname: 'api.github.com',
    path: path + '?page=1',
    headers: {
        'User-Agent': 'clns/node-commit-msg',
        'Accept': 'application/vnd.github.v3+json'
    }
};
var get = function() {
    https.get(options, function(res) {
        assert.equal(res.statusCode, 200, 'Response: ' + JSON.stringify(res.headers));

        var body = '';
        res.on('data', function(chunk) {
            body += chunk.toString();
        });

        res.on('end', function () {
            var commits = JSON.parse(body);
            commits.forEach(function(commit) {
                ct++;
                var c = commit.commit;
                var msg = c.message;
                var line = msg.split('\n')[0];
                console.log(line);

                var analysis = compendium.analyse(line);
                console.log('sentences:', analysis.length);
                analysis.forEach(function(sentence) {
                    sentence.tokens.forEach(function(token) {
                        if (/^VB/.test(token.pos)) {
                            console.log(token);
                        }
                    });
                });

                console.log('------------------------------');
            });

            if (!(ct >= limit || commits.length < defaultLimit)) {
                options.path = path + '?page=' + (Math.ceil(ct / defaultLimit)+1);
                get();
            }
        });
    });
}; // get() function

get();
