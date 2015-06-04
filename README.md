# commit-msg [![Build Status](https://travis-ci.org/clns/node-commit-msg.svg?branch=master)](https://travis-ci.org/clns/node-commit-msg) [![Coverage Status](https://coveralls.io/repos/clns/node-commit-msg/badge.svg?branch=master)](https://coveralls.io/r/clns/node-commit-msg?branch=master)

commit-msg is a customizable git commit message parser and validator
written in Node.js. It validates a given string based on
[best practices](CONTRIBUTING.md#commit-message) and can be used as a git hook
and/or directly through the API.

### Default validations

- Subject and body should be separated by an empty line, if body exists
(*error* | *configurable*)
- Subject should be capitalized (*error* | *configurable*)
- Subject has a soft and hard limit for max length (50 and 70)
(*warning* and *error* | *configurable*)
- No consecutive whitespaces allowed in subject (*error*)
- Subject should not end with a period or whitespace (*error*)
- Only [certain special characters](lib/config.js#L17) are allowed
in the subject (*error* | *configurable*)
- Subject can be prefixed with certain [type: component: ](lib/config.js#L27)
and [invalid types](lib/config.js#L34) can de detected
- [GitHub issue references](https://help.github.com/articles/closing-issues-via-commit-messages/)
should be placed in the last paragraph of the body and they should
exist on GitHub (*error* | *configurable*)
- Detection of non-imperative verbs in subject, eg. "Fix bug" not "Fixes bug" or
"Fixed bug" (*error* | *configurable*)
- Body lines should be wrapped at 72 characters (*warning* | *configurable*)

### Disclaimer

> Only use it if you agree with the guidelines it follows and
if the customization it offers is enough to meet your needs. I will not accept
changes that do not adhere to the basic rules outlined in the
[best practices](CONTRIBUTING.md#commit-message) document, unless they come
with very compelling reasons.

## Installation

#### Prerequisites

- Node.js 0.12 or newer
- Java 8 or newer (required by the parser)

Optional:

- Python 2.7 (Python 3.x is *not* supported)
- Make sure you have the Java JDK installed not just JRE

> It's recommended to install the optional dependencies as well
to be able to use the parser's API directly instead of running
shell commands.

#### Install

> On Windows, make sure you run the command below using *administrator* rights.
Eg. open PowerShell using *Run as administrator*.

```sh
npm install commit-msg --save-dev
```

This will also install (symlink) the [commit-msg](bin/commit-msg) hook
in your project's `.git/hooks/` directory so you are ready to start committing.
To disable the auto-install see the [Configuration](#configuration) section.

## Configuration

You can configure this module by specifying a `commitMsg` key in your
`package.json` file. Possible configurations are:

- `noHook` (Boolean) Set to `true` to disable the git hook auto-install
- [any key from the default `config` object](lib/config.js)

For [an example](test/resources/angular/package.json) check out
[Angular's Git Commit Guidelines](https://github.com/angular/angular.js/blob/master/CONTRIBUTING.md#commit)
config file.

## Usage

A first example is the [commit-msg](bin/commit-msg) hook. For another example
you can check the [validate](bin/validate) script. For more usages
check the [test files](test).

### API

#### `CommitMessage`

##### `CommitMessage.parse(message[, config], callback)`

- `message` (string) The message to parse
- `config` (true|string|[Config](#commitmessage-config), optional) The config object,
a string or `true`.
  - if `true` is given, it will search for the first package.json file
  starting from the current directory up, and use the `commitMsg`
  config from it, if any.
  - if string is given, it should be a directory path where the search for
  the package.json file will start, going up
  - if object is given, it will overwrite the default config object
- `callback(err, instance)` (function) The callback that will be called
with the following params:
  - `err` (Error)
  - `instance` ([CommitMessage](#commitmessage))

This is the designated initializer.

##### `CommitMessage.parseFromFile(file[, config], callback)`

- `file` (string) The file path to parse the message from
- *(all other arguments are the same as above)*

##### `<commitMessageInstance>.message: string`

Return the original message as a string. Note that this will *not* include
any comments or other text that will not be included in the commit message
by git, eg. the extra output from `git commit -v`.

##### `<commitMessageInstance>.formattedMessages: string`

Return all errors and warnings as a string, one per line, in the same order
as they were generated, including colors.

##### `<commitMessageInstance>.validate(callback)`

- `callback(err, instance)` (function) The callback that will be called
after the validation finishes
  - `err` (Error)
  - `instance` ([CommitMessage](#commitmessage))

##### `<commitMessageInstance>.hasErrors(): boolean`

Return true if there are any errors after validation.

##### `<commitMessageInstance>.hasWarnings(): boolean`

Return true if there are any warnings after validation.

#### `CommitMessage.Config`

##### `CommitMessage.Config([cfg]): object`

- `cfg` (object, optional) An object that will overwrite the [default
config object](lib/config.js).

For example, to generate a warning instead of an error for the
capitalized first letter check you can use:

```js
CommitMessage.parse(msg, CommitMessage.Config({
    capitalized: { type: Error.WARNING }
}), function(err, instance) {
    // do something with the result
});
```

#### `CommitMessage.Error`

##### `CommitMessage.Error.ERROR: string`
##### `CommitMessage.Error.WARNING: string`

### Bypass validation

If you know what you're doing you can skip the validation
altogether using `git commit --no-verify`. Be aware that this
will bypass the *pre-commit* and *commit-msg* hooks.

## Tests

Make sure you ran `npm install` prior to running the tests.

```sh
npm test
```
