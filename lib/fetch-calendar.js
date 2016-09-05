'use strict';

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
