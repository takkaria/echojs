'use strict';

const FeedParser = require('feedparser');
const Readable = require('stream').Readable;
const requestUtils = require('./request-utils');

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
				posts.push(item);
			}
		})

		parser.on('end', () => {
			cb(parser.error, posts, res.cacheData, res.newLocation);
		})

		// Convert the string into a stream for the feedparser
		let stream = new Readable();
		stream.push(data);
		stream.push(null);
		stream.pipe(parser);
	});
}

module.exports = getNewsfeed;
