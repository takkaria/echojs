'use strict';

var models = require('../models');
var Event = models.Event;
var Post = models.Post;

var ical = require('ical');
var FeedParser = require('feedparser');
var request = require('request');
var striptags = require('striptags');
var debug = require('debug')('echo:fetch');
var findDate = require('./find-date');

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
