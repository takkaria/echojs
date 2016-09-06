'use strict';

/*
 * This functions fetches an iCalendar file and passes back an array of
 * events.
 *
 * Events are returned in a format suitable for giving direct to the
 * database; this is part-ensured by the corresponding tests.
 */

const ical = require('ical');
const requestUtils = require('./request-utils');

function getCalendar(url, cb, cacheData) {
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

		// If we have data, let's parse it
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

		cb(null, finalData, res.cacheData, res.newLocation);
	});
}

module.exports = getCalendar;
