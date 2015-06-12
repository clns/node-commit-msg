# How to contribute

There are 2 ways you can contribute to this project:

1. [Create issues](#create-an-issue)
2. [Submit pull requests](#getting-started)

In both cases **make sure you're familiar with GitHub's [Contributing to a Project](https://guides.github.com/activities/contributing-to-open-source/#contributing)
guide.**

## Create an Issue

It's possible you'll encounter verb tenses that don't validate correctly.
For example a past tense sentence might pass validation, or a correct
imperative message might not validate in some cases.

The good news is these can be corrected by training the parser. The only thing
you need to do is [create an issue](https://github.com/clns/node-commit-msg/issues?utf8=✓&q=is%3Aissue)
with the message, but **only if there isn't
already an issue that refer to improper tense validation** (re-open the issue
if it's closed).

## Getting Started

##### 1. Clone the repository to your preferred location

```sh
git clone https://github.com/clns/node-commit-msg
cd node-commit-msg
```

> Or maybe you want to fork it first and clone it from your location so you
can send in pull requests.

##### 2. Install the optional prerequisites

Try to have the optional prerequisites installed. These are needed by
[node-java](https://github.com/joeferner/node-java) and it greatly improves
the parser speed (especially when running tests or using the
[validate](bin/validate) script) because it accesses the parser's API
directly instead of calling shell commands and having the
parser load the model each time.

- [Python 2.7](https://www.python.org/downloads/) (Python 3.x is *not* supported)
- [Java JDK 8](http://www.oracle.com/technetwork/java/javase/downloads/jdk8-downloads-2133151.html)
(make sure you have the JDK installed not just JRE)

##### 3. Install dependencies

```sh
npm install
```

##### 4. Start coding

- Please add/update the tests for every change you make
- When committing, make sure you're following [the guidelines](GUIDELINES.md)

### Tests

```sh
npm test
```

If you run out of
[GitHub anonymous requests](https://developer.github.com/v3/#rate-limiting)
when running the tests (you see messages like "*warning: GitHub
reference check failed with status code 403 ...*") you can provide a
[personal access token](https://github.com/settings/tokens) like this:

```sh
GITHUB_TOKEN=<token> npm test
```

or in PowerShell:

```PowerShell
$env:GITHUB_TOKEN='<token>'; npm test
```

### Troubleshooting

##### This application requires the legacy Java SE 6 runtime which is unavailable for this version of OS X.

If you encounter this runtime issue when calling java from node.js,
especially if you're on OS X 10.11 El Capitan, see
[this issue](https://github.com/joeferner/node-java/issues/223#issuecomment-110408072)
for a fix.
