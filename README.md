# YUME

[![Built with Grunt](https://cdn.gruntjs.com/builtwith.png)](http://gruntjs.com/)

YUME is a technological platform for developing web based 3D applications. Its technology stack consists of many popular frameworks like node.js, express or three.js. The goal of this project is to provide a foundation for all kinds of 3D-based web applications (especially games). YUME is written in JavaScript.

### [DEMO](http://yume.human-interactive.org/)

## Why should i use YUME?

Developing a complex 3D-application is a hard challenge. If you want to create a real product, working just with three.js or an other 3D-library is sometimes insufficient. YUME integrates different frameworks to create one comprehensive platform with many useful features:

- Node.js and its modules provide server-side features (e.g. WebSockets Server) to meet multiplayer requirements or database-functionality to manage user accounts and highscores.
- Express provides features for creating server-side web applications. Games can benefit of templating, sessions, authentication, compression, caching and more.
- Three.js provides a great 3D-library for creating WebGL-based web applications.
- PubSubJS provides a topic-based publish/subscribe mechanism, so YUME can handle even complex processes within the application.
- The use of Browserify guarantees modular programming style and robust dependency management. 

The demo-application shows different features of YUME.

- stage loading and changing (via loading screen)
- advanced First-Person Controls
- UI integration (modal dialogs, menus etc.)
- simple interaction system for First-Person adventures or shooters
- simple but fast collision detection
- i18n (text files for each local)
- chat and multiplayer example, based on WebSockets and WebWorkers
- elementary audio system based on WebAudio
- savegame and settings managers

## How to start

When you want to work with YUME, please ensure that you have a basic understanding of node.js, express and three.js. Installing YUME is simple:

- install node.js and npm
- download the repository
- go to the root directory of YUME and execute "npm install" in a console to install all dependencies
- execute "npm start" to start the application

## Developing with YUME

YUME uses Browserify to manage its dependencies. So you just develop a node.js application and generate a bundle-file for the browser with your entire code. Open a console, go to the root directory of YUME and type the following command to auto generate the bundle when editing source-files in the src-directory.

	grunt watch

Just typing the following also builds the entire web-client.

	grunt

To get a real overview of YUME, this readme-file provides insufficient information. Therefore we are going to create a basic documentation via the github wiki in the next weeks.

## History

Human Interactive is an IT startup from Germany. Our goal is to develop 3D-applications for the browser. YUME arises out of our first project "DESIRE", a First-Person Adventure. If you want an impression of our first trials, please visit our [product website](http://www.desire-the-game.com/). Thanks!