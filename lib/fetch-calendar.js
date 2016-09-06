'use strict';

/*
 * This functions fetches an iCalendar file and passes back an array of
 * events.
 *
 * Events are returned in a format suitable for giving direct to the
 * database; this is part-ensured by the corresponding tests.
 */

const request = require('request');
const ical = require('ical');
const url = require('url');

// XXX factor out into separate module
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

			result = result || {};
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

	if (cacheData.etag) {
		headers['if-none-match'] = cacheData['etag'];
	}

	return headers;
}

function getCalendar(url, cb, cacheData) {
	let headers = cacheData ? cacheDataToRequestHeaders(cacheData) : null;

	requestNoteRedirects({
		uri: url,
		headers: headers
	}, function(err, res, data) {
		if (err) {
			return cb(err, null);
		}

		let parsedData = ical.parseICS(data);
		let finalData = [];

		for (let key in parsedData) {
			if (parsedData.hasOwnProperty(key)) {
				let entry = parsedData[key];

				// We might be passed things that aren't events
				if (entry.type == 'VEVENT') {
					finalData.push({
						title: entry.summary.trim(),
						startdt: entry.start,
						enddt: entry.end,
						location_text: entry.location,
						blurb: entry.description.trim(),
						url: entry.url,
						state: 'imported',
						importid: entry.uid
					});
				}
			}
		}

		let newUrl = res.redirects ? res.redirects.newLocation : null;

		cb(null, finalData, extractCacheData(res.headers), newUrl);
	});
}

module.exports = getCalendar;
