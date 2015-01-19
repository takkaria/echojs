echojs
======

[![Build Status](https://travis-ci.org/takkaria/echojs.svg?branch=master)](https://travis-ci.org/takkaria/echojs)

A news &amp; events aggregator (rewritten in Node).

To get started, create the database:

	$ sqlite3 db.sqlite < create-tables.sql

then use bower and npm to fetch the dependencies:

	$ npm install
	$ bower install
	
and run the server:

	$ npm start

`echojs` requires the [Sass][sass] CSS preprocessor; `npm start` will
automatically try to launch `sass` with appropriate arguments. This only works
with `npm >= 2.0.0` &ndash; if you're on an older version, you can execute `npm
run sass_compat` (in a separate terminal, or with `&`) before running `nodemon`
or `node app.js`.

[sass]: http://sass-lang.com
