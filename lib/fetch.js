'use strict';

const models = require('../models');
const Event = models.Event;
const Post = models.Post;

const debug = require('debug')('echo:fetch');

const fetchCalendar = require('./fetch-calendar');
const fetchNewsfeed = require('./fetch-newsfeed');

function checkIfEventDuplicate(evt) {
	return Event.count({ where: { importid: evt.importid } })
			.then(count => (count > 0 ? true : false));
}

function addEvents(events) {
	for (let evt of events) {
		if (evt.start < new Date()) return;
		checkIfEventDuplicate(evt).then(function(dupe) {
			if (dupe === false) {
				debug('Adding new event: ' + evt.title);

				let dbEvent = Event.build(evt);
				return dbEvent.saveAndGenerateSlug({ validate: false });
			}
		})
	}
}

function addPosts(feed, posts) {
	for (let post of posts) {
		if (!post.title || !post.id) {
			debug("Post with no title or guid from feed " + feed.title);
		} else {
			return Post.findById(post.id).then(function(anyFound) {
				// Don't add duplicates
				if (anyFound === null) {
					debug('Adding new post: ' + post.title);

					post.feedId = feed.id;
					post.host = feed.title;

					return Post.build(post).save();
				}
			})
		}
	}
}

function fetchICal(url, error) {
	fetchCalendar(url, function(err, events, cacheData, newLocation) {
		if (err) {
			return error(err)
		}

		// XXX Handle cacheData & newLocation when calendars are stored in db!

		addEvents(events);
	})
}

function fetchFeed(feed) {
	debug('Fetching feed id ' + feed.id + ', URL: '+ feed.feedURL);

	let cacheData = feed.cacheData ? JSON.parse(feed.cacheData) : null;

	fetchNewsfeed(feed.feedURL, function(err, posts, events, cacheData, newLocation) {
		feed.errors = err ? err.toString() : null;
		feed.cacheData = JSON.stringify(cacheData);
		if (newLocation) {
			feed.feedURL = newLocation;
		}

		feed.save();

		addPosts(feed, posts);
		addEvents(events);
	}, cacheData)
}

module.exports = {
	ical: fetchICal,
	feed: fetchFeed
}
