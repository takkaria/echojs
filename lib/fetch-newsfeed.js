'use strict';

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
			cb(null, [], res.cacheData, res.newLocation);
		}

		cb(null, [], res.cacheData, res.newLocation);
	});
}

module.exports = getNewsfeed;
