# commit-msg [![Build Status](https://travis-ci.org/clns/node-commit-msg.svg?branch=master)](https://travis-ci.org/clns/node-commit-msg)

commit-msg is a customizable git commit message parser and validator
written in Node.js. It validates a given string based on
[best practices](CONTRIBUTING.md#commit-message) and can be used as a git hook
and/or directly through the API.

### Default validations

- Title and body should be separated by an empty line, if body exists
(*error* | *configurable*)
- Title should be capitalized (*error* | *configurable*)
- Soft and hard limits for title length (50 and 70)
(*warning, error* | *configurable*)
- No consecutive whitespaces allowed in title (*error*)
- Title should not end with a period or whitespace (*error*)
- Only certain special characters are allowed in the title
(*error* | *configurable*)
- Basic detection of non-imperative verbs, eg. "Fix bug" not "Fixes bug" or
"Fixed bug" (*warning* | *configurable*)
- [GitHub issue references](https://help.github.com/articles/closing-issues-via-commit-messages/)
should be placed in the last paragraph of the body (*warning* | *configurable*)
- Body should start with first letter capitalized (*error* | *configurable*)
- Body lines should be wrapped at 72 characters (*warning* | *configurable*)

### Disclaimer

Only use it if you agree with the guidelines it follows and
if the customization it offers is enough to meet your needs. I will not accept
changes that do not adhere to the basic rules outlined in the
[best practices](CONTRIBUTING.md#commit-message) document, unless they come
with very compelling reasons.

## Installation

```sh
$ npm install commit-msg --save-dev
```

This will also install (symlink) the `commit-msg` hook in your project's
`.git/hooks/` dir. To disable the auto-install see the
[Configuration](#configuration) section.

## Configuration

You can configure this module by specifying a `commitMsg` key in your
`package.json` file. The current configurations are:

- `noHook` (Boolean, false) Set to true to disable the git hook auto-install
- `config` (Object) For the default config take a look at the
[config object](lib/commit-message.js) in the code.  
  TODO: not there yet

###### Example `package.json` config

```json
{
  "name": "your-module",
  "version": "0.0.0",
  "devDependencies": {
    "commit-msg": "^1.0.0"
  },
  "commitMsg": {
    "noHook": true
  }
}
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
$ npm test
```

You can also run the validator against external repositories from GitHub
that are known for using good commit messages. Note that these requests
will count against your GitHub
[Rate Limiting](https://developer.github.com/v3/#rate-limiting) policy.  
For example, the following command will run against the latest commits
from repositories like [git/git](https://github.com/git/git/commits/master)
and [torvalds/linux](https://github.com/torvalds/linux/commits/master):

```sh
$ npm run test-external
```

To run all tests use:

```sh
$ npm run test-all
```
