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

function icalToEcho(data) {
	let list = [];

	for (let key in data) {
		if (data.hasOwnProperty(key)) {
			let entry = data[key];

			// We might be passed things that aren't events
			if (entry.type == 'VEVENT') {
				list.push({
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

	return list;
}

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
			return cb(null, [], res.cacheData, res.newLocation);
		}

		// XXX What happens for other status codes?

		let parsedData = ical.parseICS(data);

		cb(null, icalToEcho(parsedData), res.cacheData, res.newLocation);
	});
}

module.exports = getCalendar;
