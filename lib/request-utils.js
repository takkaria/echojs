'use strict';

const request = require('request');
const url = require('url');

/*
 * Make a request, but keep note of permanent redirects (301 codes)
 */
function requestNoteRedirects(opts, cb) {
	let newLocation = opts.uri;
	let hasRedirected = false;
	let isTemporary = false;

	let redirectOpts = {
		followRedirect: response => {
			if (!isTemporary && response.statusCode === 301) {
				newLocation = url.resolve(opts.uri, response.headers.location);
				hasRedirected = true;
			} else {
				isTemporary = true;
			}

			return true;
		}
	}

	let newOpts = Object.assign(opts, redirectOpts);

	request(newOpts, (err, res, data) => {
		if (res) {
			res.redirects = {
				redirected: hasRedirected,
				newLocation: hasRedirected ? newLocation : null
			};
		}

		cb(err, res, data);
	});
}

const CACHE_HEADERS = [
	'etag',
	'last-modified'
];

function extractPairs(from, keys) {
	let result;
	for (let key of keys) {
		if (from[key]) {
			if (!result) {
				result = {};
			}

			result[key] = from[key];
		}
	}
	return result;
}

function extractCacheData(headers) {
	return extractPairs(headers, CACHE_HEADERS);
}

function cacheDataToRequestHeaders(cacheData) {
	let headers = {};

	if (cacheData['etag']) {
		headers['if-none-match'] = cacheData['etag'];
	}

	if (cacheData['last-modified']) {
		headers['if-modified-since'] = cacheData['last-modified'];
	}

	return headers;
}

module.exports = {
	cacheDataToRequestHeaders: cacheDataToRequestHeaders,
	extractCacheData: extractCacheData,
	requestNoteRedirects: requestNoteRedirects
}
