'use strict';

var path = require('path');
var fs = require('fs');
var execSync = require('child_process').execSync;

var root = path.resolve(__dirname, '..');
var tmp = path.join(root, 'tmp');
var origin = path.join(tmp, 'origin');
var clone1 = path.join(tmp, 'clone1');
var clone2 = path.join(tmp, 'clone2');
var clone3 = path.join(tmp, 'clone3');
var clone4 = path.join(tmp, 'clone4');

before('create temporary repos', function() {
    // if (exists(tmp)) return;

    var packageJson = {
        dependencies: {
            'commit-msg': root
        }
    };
    ensureDir(tmp);

    // Create initial repo (clone1)
    execSync(
        'git init clone1',
        {cwd: tmp, stdio: [null]}
    );
    execSync(
        'git config user.email "you@example.com"; git config user.name "Your Name"',
        {cwd: clone1, stdio: [null]}
    );
    fs.writeFileSync(path.join(clone1, 'package.json'), JSON.stringify(packageJson));
    execSync(
        'git add .; git commit -m "Initial commit"',
        {cwd: clone1, stdio: [null]}
    );

    // Create bare repo (origin)
    execSync(
        'git clone --bare clone1 origin',
        {cwd: tmp, stdio: [null]}
    );
    execSync(
        'git config commitMsg.noClientHook true',
        {cwd: origin, stdio: [null]}
    );
    // can't install without a package.json
    fs.writeFileSync(path.join(origin, 'package.json'), JSON.stringify(packageJson));

    // Create clone2
    execSync(
        'git clone origin clone2',
        {cwd: tmp, stdio: [null]}
    );
    execSync(
        'git config user.email "you@example.com"; git config user.name "Your Name"',
        {cwd: clone2, stdio: [null]}
    );
    packageJson.commitMsg = {
        noClientHook: false,
        noServerHook: true
    };
    fs.writeFileSync(path.join(clone2, 'package.json'), JSON.stringify(packageJson));
    execSync(
        'git add .; git commit -m "Prevented installing the server hook in package.json"',
        {cwd: clone2, stdio: [null]}
    );

    // Create clone3
    execSync(
        'git clone origin clone3',
        {cwd: tmp, stdio: [null]}
    );
    execSync(
        'git config user.email "you@example.com"; git config user.name "Your Name"',
        {cwd: clone3, stdio: [null]}
    );
    packageJson.commitMsg = {
        noClientHook: true
    };
    fs.writeFileSync(path.join(clone3, 'package.json'), JSON.stringify(packageJson));
    execSync(
        'git add .; git commit -m "Prevent installing the client hook in package.json\n\n'+
        'The client hook should not be installed, prevented by package.json.\n"',
        {cwd: clone3, stdio: [null]}
    );
    fs.writeFileSync(path.join(clone3, 'added-on-feature-branch.txt'), 'this file was added on the feature branch');
    execSync(
        'git checkout -b feature; git add .; git commit -m "Add file on the feature branch"',
        {cwd: clone3, stdio: [null]}
    );
    execSync(
        'git checkout -b hotfix',
        {cwd: clone3, stdio: [null]}
    );
    fs.writeFileSync(path.join(clone3, 'added-on-branch.txt'), 'this file was added on branch');
    execSync(
        'git add .; git commit -m "Add file on branch."; '+
        'git checkout master; git merge --no-ff --no-edit hotfix',
        {cwd: clone3, stdio: [null]}
    );

    // Create clone4
    execSync(
        'git clone origin clone4',
        {cwd: tmp, stdio: [null]}
    );
    execSync(
        'git config commitMsg.noClientHook true; git config commitMsg.noServerHook true',
        {cwd: clone4, stdio: [null]}
    );
});

after('delete temporary repos', function() {
    rmdirSync(tmp);
});

function exists(dir) {
    var exists = false;
    try {
        exists = fs.statSync(dir).isDirectory();
    } catch (e) {}
    return exists;
}
function ensureDir(dir) {
    return exists(dir) || fs.mkdirSync(dir);
}
function rmdirSync(dir,file){
  var p = file? path.join(dir,file):dir;
  // if(!fs.exists(p)) return
  if(fs.lstatSync(p).isDirectory()){
    fs.readdirSync(p).forEach(rmdirSync.bind(null,p))
    fs.rmdirSync(p)
  }
  else fs.unlinkSync(p)
}

module.exports = {
    tmp: tmp,
    origin: origin,
    clone1: clone1,
    clone2: clone2,
    clone3: clone3,
    clone4: clone4
};
