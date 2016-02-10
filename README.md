# echojs

[![Build Status](https://travis-ci.org/takkaria/echojs.svg?branch=master)](https://travis-ci.org/takkaria/echojs)
[![Code Climate](https://codeclimate.com/github/takkaria/echojs/badges/gpa.svg)](https://codeclimate.com/github/takkaria/echojs)
[![Dependency Status](https://david-dm.org/takkaria/echojs.svg)](https://david-dm.org/takkaria/echojs)
[![devDependency Status](https://david-dm.org/takkaria/echojs/dev-status.svg)](https://david-dm.org/takkaria/echojs#info=devDependencies)

A NodeJS-based news &amp; events aggregator.

To get started:

	$ git clone https://github.com/takkaria/echojs.git
	$ cd echojs

	$ bin/initdb         # Create the database
	$ npm run deploy     # Fetch dependencies, build CSS
	$ npm start          # Run the server

Echo uses a [.env file](https://www.npmjs.com/package/dotenv) to store configuration values.  Please see the example config file `.env.example`, and copy it to `.env` before modifying it.

## What is this for?

echojs is a rewrite of the software behind https://echomanchester.net/ (it's not yet taken over that site).  Echo came out of the desire to pull together the disparate left-wing activity in Manchester, UK onto one site without demanding centralisation in the way that big social media websites do.  It has an events calendar which anyone can add events to, and a news aggregator so you can list news from different sites in one place.

Features:
 - Events calendar
   - Anyone can add events
   - Admins can moderate
   - Can import iCalendar feeds
 - Reasonably pretty
 - News aggregator
   - attempts to scrape imported posts for event information

## Future plans

At the moment the code is still evolving and isn't suitable for people to modify and deploy themselves.  It's also got a lot of hard-coded stuff relating to its original city.  However, we'd love to build it out so that it could be used in other places too, so if this is something you're interested in, please get in touch.

## Similar projects

[Demosphere.eu](http://demosphere.eu/) is a similar project but much better established.   It is not designed for multiple deployments, but rather each city gets hosted on the same master servers.

## Note if using npm <2

`echojs` uses the node-sass CSS preprocessor.  `npm start` will automatically try to launch `node-sass` with appropriate arguments. This only works with `npm >= 2.0.0` &ndash; if you're on an older version, you can execute `npm run sass_compat` (in a separate terminal, or with `&`) before running `nodemon` or `node app.js`.
