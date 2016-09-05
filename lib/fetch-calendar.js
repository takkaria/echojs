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

function getCalendar(url, cb) {
	request(url, function(err, res, data) {
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

		cb(null, finalData);
	});
}

module.exports = getCalendar;
