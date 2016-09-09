'use strict';

const FeedParser = require('feedparser');
const Readable = require('stream').Readable;
const striptags = require('striptags');

const requestUtils = require('./request-utils');
const findDate = require('./find-date');

function stringToStream(str) {
	let stream = new Readable();
	stream.push(str);
	stream.push(null);
	return stream;
}

const postToDatabaseFormat = post => ({
	id: post.guid,
	title: post.title,
	link: post.link,
	date: post.pubDate
})

const postToEvent = (post, date) => ({
	title: post.title,
	startdt: date,
	url: post.link,
	blurb: striptags(post.description),
	state: 'imported',
	importid: post.guid,
	email: 'imported-noreply@echomanchester.net'
})

function checkPostForEvent(post) {
	const now = new Date();
	const THREE_MONTHS = 7.88923e9; // 3 months in ms

	// Ignore posts older than three months
	if (!post.pubDate ||
			post.pubDate.getTime() < (now.getTime() - THREE_MONTHS)) {
		return;
	}

	// Try to find a date in the post
	let date = findDate(post.date, post.description);
	if (!date) {
		return;
	}

	// Ignore if already in the past or more than 3 months in the future
	if (date.getTime() < now.getTime() ||
			date.getTime() > (now.getTime() + THREE_MONTHS)) {
		return;
	}

	return postToEvent(post, date);
}

function getNewsfeed(url, cb, cacheData) {
	let headers = cacheData ? requestUtils.cacheDataToRequestHeaders(cacheData) : null;

	requestUtils.requestNoteRedirects({
		uri: url,
		headers: headers
	}, function(err, res, data) {
		if (err) {
			return cb(err, null);
		}

		// 304 Not Modified
		if (res.statusCode === 304) {
			return cb(null, [], [], res.cacheData, res.newLocation);
		}

		// XXX What happens for other status codes?

		let parser = new FeedParser();
		let posts = [];
		let events = [];

		parser.on('error', error => {
			parser.error = error
		});

		parser.on('readable', () => {
			let item;
			while (item = parser.read()) {
				posts.push(postToDatabaseFormat(item));

				let evt = checkPostForEvent(item);
				if (evt) {
					events.push(evt);
				}
			}
		})

		parser.on('end', () => {
			cb(parser.error, posts, events, res.cacheData, res.newLocation);
		})

		stringToStream(data).pipe(parser);
	});
}

module.exports = getNewsfeed;
