# jdj-cert-app
React/Electron app (GUI) for managing jdj-cert-worker process

## Development environment setup

### Install required software

#### Install nodejs
https://nodejs.org/en/download/

#### Install yarn
https://yarnpkg.com/lang/en/docs/install/

#### Install React via command line
yarn global add create-react-app

### Setup app via command line interface

git clone git@github.com:taffgear/jdj-cert-app.git

cd jdj-cert-app
yarn install
mkdir dist
mkdir build
nano config.json

### Config example

```json
{
  "webhook_worker": {
    "uri": "http://ip:port"
  },
  "api" : {
    "uri": "http://ip:port",
    "auth": {
      "username": "username",
      "password": "password"
    }
  },
  "max_articles": 100
}
```

**[Webhook worker](https://github.com/taffgear/jdj-cert-worker) and [api](https://github.com/taffgear/jdj-cert-app) services need to be active for the app to function correctly!**

### Start/deploy app

#### Start in browser
yarn start

#### Start in current OS
yarn run electron-dev

#### Deploy for Windows
yarn run package-win

#### Deploy for linux
yarn run package-linux

Deployed apps can be found in dist folder.

### Important files

src/App.js

src/App.css

public/index.html

public/electron.js
