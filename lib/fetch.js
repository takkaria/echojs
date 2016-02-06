'use strict';

var models = require('./models');
var Event = models.Event;
var Post = models.Post;

var ical = require('ical');
var FeedParser = require('feedparser');
var request = require('request');
var striptags = require('striptags');
var debug = require('debug')('echo:fetch');

// = iCal ===================================================== //

function iCalDataToEvent(item) {
	return Event.build({
		title: item.summary.trim(),
		startdt: item.start,
		enddt: item.end,
		location_text: item.location,
		blurb: item.description.trim(),
		url: item.url,
		state: 'imported',
		importid: item.uid
	});
}

function processICalEntry(entry, opts) {
	if (!entry.start || entry.start < new Date()) return;
	if (opts.filter && opts.filter(entry)) return;

	// Don't duplicate events
	Event.count({ where: { importid: entry.uid } })
			.then(function(count) {
		if (count > 0) return;

		if (opts.transform) opts.transform(entry);

		debug('Adding new event: ' + entry.summary);
		return iCalDataToEvent(entry).saveAndGenerateSlug({ validate: false });
	}).catch(opts.error);
}

function fetchICal(opts) {
	debug('Fetching iCal ' + opts.url);

	ical.fromURL(opts.url, {}, function useICalData(data) {
		for (var k in data) {
			if (!data.hasOwnProperty(k)) continue;
			processICalEntry(data[k], opts);
		}
	});
}

// = Atom/RSS ================================================= //

// 'Safe' exec - returns an array no matter what, so you can index into it
RegExp.prototype.sexec = function(str) {
	return this.exec(str) || [ ];
};

function monthToInt(s) {
	var first3 = s.slice(0, 3).toLowerCase();
	var a = {
		jan: 1,  feb: 2,  mar: 3,  apr: 4,
		may: 5,  jun: 6,  jul: 7,  aug: 8,
		sep: 9,  oct: 10, nov: 11, dec: 12
	};

	return a[first3] || null;
}

function findDate(base, text) {

	var time = /\d?\d[\.:]\d\d([ap]m)?/.sexec(text)[0] ||
			/\d?\d([ap]m)/.sexec(text)[0];

	var day = /(\d?\d)(st|nd|rd|th)/.sexec(text)[1];

	var month = /(January|February|March|May|April|June|July|August|September|October|November|December)/.sexec(text)[0] ||
			/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/.sexec(text)[0];

	if (time && day && month) {
		var d = new Date();

		// We set the day of the month to 1 first for the following reason:
		// Say it's February 2016, a leap year - so February has 29 days.
		// If the date we are setting is 30 January 2016, doing:
		//   (new Date()).setDate(30)
		// ...will result in a date object set to 1 March.
		//
		// Similarly, if it's 31 May, and you want to set the date to 28 Feb,
		// (new Date()).setMonth(2) gets you 3 March.
		d.setDate(1);

		// Months in JS are 0-11, not 1-12
		d.setMonth(monthToInt(month) - 1);
		d.setDate(parseInt(day));

		// Assume year in the future
		if (d.getMonth() < base.getMonth())
			d.setYear(base.getFullYear() + 1);
		else
			d.setYear(base.getFullYear());

		var hours = parseInt(time);

		if (!/(am|pm)/.test(time)) {
			if (hours > 0 || hours <= 6)
				hours += 12;
		} else if (/pm/.test(time)) {
			hours += 12;
		}

		var minutes = parseInt(/[\.:](\d\d)/.sexec(time)[1]) || 0;

		d.setHours(hours, minutes, 0, 0);

		return d;
	}

	return null;
}

// Returns a Promise, if anything
function checkPostForEvent(post, error) {
	const now = new Date();

	// Check it's not too far in the past
	if (post.pubDate.getTime() < (now.getTime() - 7.88923e9)) // 1.578e10 == 3 months in ms
		return;

	// Check if it's like an event
	let date = findDate(post.pubDate, post.description);
	if (!date) return;

	// Check it's not too far in the future
	if (date.getTime() < now.getTime() ||
			date.getTime() > (now.getTime() + 7.88923e9)) // 1.578e10 == 3 months in ms
		return;

	return Event.findById(post.guid).then(function(anyFound) {
		// Don't add duplicates
		if (anyFound === null) {
			debug('Adding new event: ' + post.title);

			return Event.build({
				title: post.title,
				startdt: date,
				url: post.link,
				blurb: striptags(post.description),
				state: 'imported',
				importid: post.guid
			}).save({ validate: false });
		}
	});
}

// The following URL is useful for understanding the contents of 'post'
// https://github.com/danmactough/node-feedparser#what-is-the-parsed-output-produced-by-feedparser
//
// Returns a Promise
function processPost(feed, post) {
	if (!post.title || !post.guid) {
		debug("Post with no title");
		return;
	}

	return Post.findById(post.guid).then(function(anyFound) {
		// Don't add duplicates
		if (anyFound === null) {
			debug('Adding new post: ' + post.title);

			Post.build({
				id: post.guid,
				title: post.title,
				link: post.link,
				date: post.pubDate,
				feedId: feed.id,
			}).save();

			return checkPostForEvent(post);
		}
	})
}

function fetchFeed(feed) {
	feed.errors = null;
	feed.lastFetched = new Date();
	feed.save();

	let req = request(feed.feedURL);
	let feedparser = new FeedParser();

	let errorHandler = function(error) {
		feed.errors = error.toString();
		debug(error);
		feed.save();
	}

	req.on('error', errorHandler);
	req.on('response', function(res) {
		if (res.statusCode != 200)
			return this.emit('error', new Error('Bad status code'));

		this.pipe(feedparser);
	});

	debug('Fetching feed id ' + feed.id + ', URL: '+ feed.feedURL);

	feedparser.on('error', errorHandler);
	feedparser.on('readable', function() {
		let post;
		while ((post = this.read())) {
			processPost(feed, post);
		}
	});
}

// = Exports ================================================== //

module.exports = {
	ical: fetchICal,
	feed: fetchFeed,
	findDate: findDate,

	_processICalEntry: processICalEntry,
	_iCalDataToEvent: iCalDataToEvent
};
