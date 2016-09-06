'use strict';

const models = require('../models');
const Event = models.Event;
const Post = models.Post;

const ical = require('ical');
const FeedParser = require('feedparser');
const request = require('request');
const striptags = require('striptags');
const debug = require('debug')('echo:fetch');
const findDate = require('./find-date');

const fetchCalendar = require('./fetch-calendar');

// = iCal ===================================================== //

function checkIfDuplicate(evt) {
	return Event.count({ where: { importid: evt.importid } })
			.then(count => (count > 0 ? true : false));
}

function fetchICal(url, error) {
	fetchCalendar(url, function(err, data, cacheData, newLocation) {
		if (err) {
			return error(err)
		}

		// XXX Handle cacheData & newLocation when calendars are stored in db!

		for (let evt of data) {
			if (evt.start < new Date()) return;
			checkIfDuplicate(evt).then(function(dupe) {
				if (dupe === false) {
					debug('Adding new event: ' + evt.title);

					let dbEvent = Event.build(evt);
					return dbEvent.saveAndGenerateSlug({ validate: false });
				}
			})
		};
	})
}

// = Atom/RSS ================================================= //

// Returns a Promise, if anything
function checkPostForEvent(post) {
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

			return Post.build({
				id: post.guid,
				title: post.title,
				link: post.link,
				date: post.pubDate,
				feedId: feed.id,
			}).save().then(checkPostForEvent);
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
};
