# Troubleshooting

### Install errors

##### MSB4019: The imported project "D:\Microsoft.Cpp.Default.props" was not found.

```
MSB4019: The imported project "D:\Microsoft.Cpp.Default.props" was not found.
Confirm that the path in the <Import> de claration is correct, and that the file exists on disk.
gyp ERR! build error
gyp ERR! stack Error: `C:\Windows\Microsoft.NET\Framework\v4.0.30319\msbuild.exe` failed with exit code: 1
...
npm WARN optional dep failed, continuing java@0.5.4
```

This is an optional dependency and the validator will work fine without it,
so you don't need to do anything.

##### ld: library not found for -lgcc_s.10.5

This usually happens if you're on OS X 10.11 beta but you're using
the Xcode 6 toolchain instead of Xcode 7 beta. To check this run:

```sh
$ xcode-select -p
/Applications/Xcode.app/Contents/Developer
```

If you see this output try changing it to Xcode 7 beta with:

```sh
sudo xcode-select -s /Applications/Xcode-beta.app/Contents/Developer
```

For more info see [this issue](https://github.com/Homebrew/homebrew/issues/40653#issuecomment-111735591).

### Runtime errors

##### /usr/bin/env: node: No such file or directory

This means that Node.js is not in your PATH, or the program
you're using to commit doesn't know about it. Try restarting
the program and if this doesn't fix the issue a log-off
(or restart) will most likely fix it.

##### This application requires the legacy Java SE 6 runtime which is unavailable for this version of OS X.

If you encounter this runtime issue when calling java from node.js,
especially if you're on OS X 10.11 El Capitan, see
[this issue](https://github.com/joeferner/node-java/issues/223#issuecomment-110408072)
for a fix.
