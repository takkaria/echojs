# echojs

[![Build Status](https://travis-ci.org/takkaria/echojs.svg?branch=master)](https://travis-ci.org/takkaria/echojs)
[![Code Climate](https://codeclimate.com/github/takkaria/echojs/badges/gpa.svg)](https://codeclimate.com/github/takkaria/echojs)

A news &amp; events aggregator (rewritten in Node).

To get started, create the database:

	$ bin/initdb

then use bower and npm to fetch the dependencies:

	$ npm install
	$ bower install
	
and run the server:

	$ npm start

`echojs` uses the node-sass CSS preprocessor.  `npm start` will
automatically try to launch `node-sass` with appropriate arguments.
This only works with `npm >= 2.0.0` &ndash; if you're on an older
version, you can execute `npm run sass_compat` (in a separate terminal,
or with `&`) before running `nodemon` or `node app.js`.


## Environment variables

These are things you can set as environment variables, or using a .env file:

| Variable        | Description
| --------------- | -------------------------------------------------------------
| ENV             | can be production 'development' or 'development'
| DBPATH          | an alternate path to the sqlite database
| STATICHOST      | (optional) use a different base URL for static resources
| BCRYPT_FACTOR   | (optional, default 10) bcrypt difficulty setting
| LOG_PATH        | (optional, default ./logs) where to store logs
| SMTP_HOST       | SMTP host
| SMTP_USER       | SMTP username
| SMTP_PASS       | SMTP password
| SMTP_FROM       | From line in emails
| SMTP_SECURE     | set this to enable secure sending
| SMTP_NOSEND     | set this to disable actual sending, useful for test set-ups
| LOGGLY_TOKEN    | (optional) token for Loggly logging support
| LOGGLY_DOMTAIN  | (optional) subdomain for loggly support
