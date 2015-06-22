# Changing a commit message

If you need to change a commit message, you can use the `git commit-msg`
command that comes with the validator to make it easier. However changing
the commit message will change the commit ID, so you need to understand
the implications.

Editing messages for commits that only exist locally on your machine
should be safe in general, but once you push those commits to a remote
server things get tricky and you should avoid amending those commits.

For more details see GitHub's
[Changing a commit message](https://help.github.com/articles/changing-a-commit-message/)
guide.

### Use `git commit-msg`

From the root of your project, where you have the commit-msg module
installed, you can use the following to see the command help:

```sh
PATH=node_modules/.bin:$PATH git commit-msg
```

or in PowerShell:

```PowerShell
$env:PATH+=";"+(Resolve-Path node_modules/.bin)
# then you can simply use 'git commit-msg'
```

Note how we added `node_modules/.bin` to the PATH variable. You can simply
use `git commit-msg` if you installed the module globally.

##### Having a commit rejected by the server

When the server rejects your commit(s), you will see something like this:

```sh
remote: 1 commit failed on refs/heads/master due to invalid commit message
remote: 9965906: Add feature X.
remote: error (1,19): Commit subject should not end with a period
remote: You can run this command in your project root to see all the error messages:
remote:   $ echo "9965906" | node node_modules/commit-msg/bin/validate stdin
```

At the end you'll see a command you can use to see the error messages,
locally. You can use the same commit hashes to edit the messages, like this:

```sh
PATH=node_modules/.bin:$PATH git commit-msg "9965906"
```

You'll see more examples in the command help.
