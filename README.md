![remoteloop logo](documentation/img/remoteloop-logo.png)

`remoteloop` is the easiest way to remote control your PC from mobile phone.

Designed for macOS, Linux, Windows.

## Running

In order to run locally type the following:

```
npm install
npm run bootstrap
npm start
```

## Building

Building does not support cross-compiling. In order to build you must be logged in to a host having the target OS for the build. Once logged in, type the following:

```
# Mac OS
npm run build:desktop:mac

# Windows
npm run build:desktop:win
```
