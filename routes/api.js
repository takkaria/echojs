'use strict';

var express = require('express');
var router = express.Router();

var models = require('../models');

var ical = require('ical-generator');
var moment = require('moment');

/* GET root */
router.get('/', function(req, res) {
	res.send('try .../json or .../ical');
});

function isNumber(str) {
	return typeof(str) == 'number' ||
			(typeof(str) == 'string' && str.match(/^(\d+)$/));
}

function today() {
	var d = new Date();
	d.setHours(0, 0, 0, 0);
	return d.getTime() / 1000;
}

function inMonths(n) {
	var d = new Date();
	d.setMonth(d.getMonth() + n);
	return d.getTime() / 1000;
}

function parseOpts(req) {
	var clauses = [ 'state="approved"' ];

	var start = req.query.start || today();
	if (start) {
		if (isNumber(start))
			clauses.push("startdt >= datetime(' + start + ', 'unixepoch')");
	}

	var end = req.query.end || inMonths(3);
	if (end) {
		if (isNumber(end))
			clauses.push("startdt <= datetime(' + end + ', 'unixepoch')");
	}

	return clauses;	
}

router.get('/json', function(req, res) {
	var clauses = parseOpts(req);

	// This particular kind of JSON output is designed to be suitable input
	// to FullCalendar.

	models.Event.findAll({
		where: [clauses.join(' AND '), []],
		attributes: [ 'id', 'title', 'startdt', 'enddt' ],
		order: 'startdt ASC',
	}).then(function(events) {
		var data = events.map(e =>
			({ id: e.id, title: e.title, start: e.startdt, end: e.enddt })
		);

		req.header('Content-Type', 'application/json');
		res.send(JSON.stringify(data, ' '));
	});
});

router.get('/json/locations', function(req, res) {
	models.Location
		.findAll({ attributes: [ 'id', 'name', 'address' ] })
		.then(function(locations) {
			req.header('Content-Type', 'application/json');

			locations.forEach(function(location) {
				location.address = location.address.replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1, ');
				// FIXME: Maybe do this client-side
			});

			res.send(JSON.stringify(locations, null, ' '));
		});
});

function generateCalendar(events) {
	return new Promise(function(resolve, reject) {
		var cal = ical({
			domain: 'echomanchester.net',
			name: 'Echo Manchester',
			timezone: 'Europe/London',
			prodId: {
				company: 'Chamber Products',
				product: 'Echo',
				language: 'EN'
			},
			ttl: 60 * 60 * 12
		});

		events.forEach(function(event_) {
			var start = moment(event_.startdt);
			var end = event_.enddt ? moment(event_.enddt) : null;

			cal.createEvent({
				uid: event_.id,
				timezone: 'Europe/London',
				start: start.toDate(),
				end: end ? end.toDate() : undefined,
				allDay: event_.allday,
				summary: event_.title,
				description: event_.blurb,
				location: event_.location,
				url: event_.url || undefined,
			});
		});

		resolve(cal);
	});
}

router.get('/ical', function(req, res) {
	var clauses = parseOpts(req);

	clauses = clauses || [];

	models.Event.findAll({
		where: [clauses.join(' AND '), []],
		attributes: [ 'id', 'title', 'startdt', 'enddt', 'location_text', 'blurb', 'url', 'host' ],
		order: 'startdt ASC',
	}).then(function(events) {
		return generateCalendar(events);
	}).then(function(calendar) {
		calendar.serve(res);
	}).catch(function(err) {
		res.status(500).end();
	});
});

module.exports = router;
