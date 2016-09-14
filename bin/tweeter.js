#!/usr/bin/env node

'use strict';

require('dotenv').load();

const querystring = require('querystring');
const request = require('request');
const moment = require('moment');
const twitter = require('../lib/twitter');

function requestEvents(params, cb) {
	const url = 'https://echomanchester.net/api/json?' + querystring.stringify(params);

	request(url, function(err, resp, body) {
		if (err) {
			cb(err);
		} else {
			let evts = JSON.parse(body);
			for (let evt of evts) {
				evt.start = moment(evt.start);

				if (evt.end) {
					evt.end = moment(evt.end);
				}
			}

			cb(null, evts);
		}
	});
}

function generateTime(beginning) {
	return function() {
		var time = (this.minutes() === 0) ? 'ha' : 'h:mma';
		return beginning + time;
	}
}

moment.defineLocale('en-tweet', {
	calendar: {
		lastDay:  generateTime('[Yesterday] '),
		sameDay:  generateTime('[Today] '),
		nextDay:  generateTime('[Tomorrow] '),
		lastWeek: generateTime('[Last] dddd '),
		nextWeek: generateTime('dddd '),
		sameElse: 'ddd D MMM'
	}
});

const urlLength = 23;
const maxLength = 140 - urlLength;

function eventToText(evt) {
	let date = evt.start.locale('en-tweet').calendar();
	let fullUrl = 'https://echomanchester.net' + evt.url;
	let main = date + ': ' + evt.title.trim();

	if (main.substr(0, maxLength) !== main)
		main = main.substr(0, maxLength - 3) + '...';

	return main + ' ' + fullUrl;
}

const date = moment().format('YYYY-MM-DD');
const params = {
	start: date,
	end: date
};

const seconds = 1000;
const minutes = 60 * seconds;

requestEvents(params, (err, evts) => {
	let num = 0;

	if (err) {
		console.error(err);
		return;
	}

	for (let evt of evts) {
		let text = eventToText(evt);
		console.log('Tweet: "' + text + '"');

		// Leave a 2 minute delay for each tweet after the first
		let delay = num * 2 * minutes;

		setTimeout(() => {
			twitter.sendTweet(text, (err, resp) => {
				if (err)
					console.error(err);
				else
					console.log('Tweet success: ' + resp.text);
			})
		}, delay);

		num++;
	}
});
