'use strict';

const request = require('request');

function getCalendar(url, cb) {
	request(url, function(err, res, data) {
		cb(null, []);
	});
}

module.exports = getCalendar;
