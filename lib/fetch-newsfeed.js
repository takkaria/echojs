'use strict';

const FeedParser = require('feedparser');
const Readable = require('stream').Readable;
const requestUtils = require('./request-utils');

function toStream(str) {
	let stream = new Readable();
	stream.push(str);
	stream.push(null);
	return stream;
}

const postToEcho = post => ({
	id: post.guid,
	title: post.title,
	link: post.link,
	date: post.pubDate
})

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
		if (res.status === 304) {
			return cb(null, [], res.cacheData, res.newLocation);
		}

		// XXX What happens for other status codes?

		let parser = new FeedParser();
		let posts = [];

		parser.on('error', error => {
			parser.error = error
		});

		parser.on('readable', () => {
			let item;
			while (item = parser.read()) {
				posts.push(postToEcho(item));
			}
		})

		parser.on('end', () => {
			cb(parser.error, posts, res.cacheData, res.newLocation);
		})

		toStream(data).pipe(parser);
	});
}

module.exports = getNewsfeed;
