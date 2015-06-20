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
var hooks = path.join(git, "hooks");
var uninstall = process.argv[2];
var noClientHook = false;
var noServerHook = false;
var shouldContinue = function() {
	return !(noClientHook && noServerHook);
}

// Don't install hooks if package.json has "no[Client|Server]Hook": true
// or if `commitMsg.no[Client|Server]Hook` is true in `git config`.
if (!uninstall) {
	var output;
	try {
		output = execSync('git config --bool commitMsg.noClientHook', {
			cwd: process.cwd(), encoding: 'utf8', stdio: [null]
		}).trim();
		noClientHook = output === 'true';
	} catch(e) {}
	try {
		output = execSync('git config --bool commitMsg.noServerHook', {
			cwd: process.cwd(), encoding: 'utf8', stdio: [null]
		}).trim();
		noServerHook = output === 'true';
	} catch(e) {}
	if (shouldContinue()) {
		var rootPackage = path.resolve(root, "package.json");
		if (fs.existsSync(rootPackage)) {
			rootPackage = require(rootPackage);
			if (rootPackage.commitMsg) {
				noClientHook |= rootPackage.commitMsg.noClientHook;
				noServerHook |= rootPackage.commitMsg.noServerHook;
			}
		}
	}

	if (shouldContinue() && !fs.existsSync(hooks)) {
		fs.mkdirSync(hooks);
	}
}

function setupHook(hookName, install) {
	var hook = path.resolve(hooks, hookName);
	var hookFile = path.relative(hooks, "./bin/"+hookName);
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
	    return;
	}

	// Install hook

	if (install) {
		if (hookExists && isOtherHook()) {
		    console.error('A hook already exists at %s.\n' +
		      'Remove it and re-install the module again to install the hook.',
			  hook);
		} else if (!hookExists) {
		    try {
		        fs.symlinkSync(hookFile, hook);
		        console.log('Install hook at ' + hook);
		    } catch(e) {
		        throw e;
		    }
		}
	} else {
		console.log('Skip \'%s\' hook', hookName);
	}
}

setupHook('commit-msg', !noClientHook);
setupHook('update', !noServerHook);
