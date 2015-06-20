'use strict';

// Install/uninstall the git hook

var path = require('path');
var fs = require("fs");
var execSync = require('child_process').execSync;
var root = __dirname;
var git;
(function getParentGit() {
	var newPath = path.resolve(root, '..');
	if (root != newPath) {
		root = newPath;
		git = path.join(root, ".git");
		var isRepo = false;
		try {
			isRepo = fs.statSync(git).isDirectory();
		} catch(e) {}
		if (!isRepo) {
			// maybe a bare repo?
			git = root;
			try {
				fs.statSync(path.join(git, 'config'));
				isRepo = execSync('git config --bool core.bare', {
					cwd: git,
					encoding: 'utf8',
					stdio: [null]
				}).trim() === 'true';
			} catch(e) {}
		}
		if (!isRepo) {
			getParentGit(); // continue searching
		}
	} else {
		// If we couldn't find any .git dir, exit
		console.error("Could not find git repo starting at " + __dirname);
		process.exit(0);
	}
}());
var hooks = path.resolve(git, "hooks");
var uninstall = process.argv[2];

// Don't install hook if package.json has "commitMsg": { "noHook": true }
var rootPackage = path.resolve(root, "package.json");
if (fs.existsSync(rootPackage)) {
	rootPackage = require(rootPackage);
	if (rootPackage.commitMsg && rootPackage.commitMsg.noHook) {
		console.log('package.json indicates to skip hook');
		process.exit(0);
	}
}

if (!fs.existsSync(hooks)) {
	fs.mkdirSync(hooks);
}

var hook = path.resolve(hooks, "commit-msg");
var hookFile = path.relative(hooks, "./bin/commit-msg");
var hookExists = fs.existsSync(hook);
var _isOtherHook;
function isOtherHook() {
    if (typeof(_isOtherHook) == 'undefined') {
        var content = fs.readFileSync(hook, { encoding: 'utf8' });
        _isOtherHook = !/clns\/node-commit-msg/.test(content);
    }
    return _isOtherHook;
}

// Uninstall hook

if (uninstall) {
    if (hookExists && !isOtherHook()) {
        try {
            fs.unlinkSync(hook);
            console.log('Uninstall hook at ' + hook);
        } catch(e) {
            throw e;
        }
    }
    process.exit(0);
}

// Install hook

if (hookExists && isOtherHook()) {
    console.error('A commit-msg hook already exists at ' + hook +
    '\nRemove it and re-install commit-msg again to install the hook.');
} else if (!hookExists) {
    try {
        fs.symlinkSync(hookFile, hook);
        console.log('Install hook at ' + hook);
    } catch(e) {
        throw e;
    }
}
