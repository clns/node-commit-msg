# http-range [![Build Status](https://travis-ci.org/clns/node-commit-msg.svg?branch=master)](https://travis-ci.org/clns/node-commit-msg)

TODO: description here

## Installation

```sh
$ npm install commit-msg --save
```

## Usage

TODO

```js
var ContentRange = require('http-range').ContentRange;
var Range = require('http-range').Range;

// Parsing and creating 'Content-Range' header
ContentRange.prototype.parse('bytes 0-49/50');  // Content-Range: bytes 0-49/50
new ContentRange('bytes', '0-49', 50).toString(); // => bytes 0-49/50

// Parsing and creating 'Range' header
Range.prototype.parse('bytes=0-49');  // Range: bytes=0-49
new Range('bytes', '0-49'); // => bytes=0-49
```

For more usages check the [test files](test).

## API

TOOD

## Tests

```sh
$ make test
```
