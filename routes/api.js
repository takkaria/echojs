var express = require('express');
var router = express.Router();

var models = require('../models')

var icalGenerator = require('../lib/ical-generator');
var moment = require('moment');

/* GET root */
router.get('/', function(req, res) {
	res.send('try .../json or .../ical');
});

function isNumber(str) {
	return typeof(str) == "number" ||
			(typeof(str) == "string" && str.match(/^(\d+)$/));
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
	var clauses = [ "state='approved'" ];

	var start = req.query.start || today();
	if (start) {
		if (isNumber(start))
			clauses.push("startdt >= datetime(" + start + ", 'unixepoch')");
	}

	var end = req.query.end || inMonths(3);
	if (end) {
		if (isNumber(end))
			clauses.push("startdt <= datetime(" + end + ", 'unixepoch')");
	}

	return clauses;	
}

router.get('/json', function(req, res) {
	var clauses = parseOpts(req),
		_events = [];

	// This particular kind of JSON output is designed to be suitable input
	// to FullCalendar.

	models.Event.findAll({
		where: [clauses.join(" AND "), []],
		attributes: [ "id", "title", "startdt", "enddt", "location_text", "blurb", "url", "cost" ],
		order: "startdt ASC",
	}).then(function(events) {
		req.header("Content-Type", "application/json");

		events.forEach(function(_e) {
			_events.push({
				id: _e.id, title: _e.title, start: _e.startdt, end: _e.enddt,
				location_text: _e.location_text, blurb: _e.blurb, url: _e.url, 
				cost: _e.cost
			});
		});

		res.send(JSON.stringify(_events, " "));
	});
});

router.get('/json/locations', function(req, res) {
	models.Location
		.findAll({ attributes: [ "id", "name", "address" ] })
		.then(function(locations) {
			req.header("Content-Type", "application/json");

			locations.forEach(function(location) {
				location.address = location.address.replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1, ');
				// FIXME: Maybe do this client-side
			});

			res.send(JSON.stringify(locations, null, " "));
		});
});

router.get('/ical', function(req, res) {
	var clauses = parseOpts(req);

	models.Event.findAll({
		where: [clauses.join(" AND "), []],
		attributes: [ "id", "title", "startdt", "enddt", "location_text", "blurb", "url", "cost", "host" ],
		order: "startdt ASC",
	}).then(function(events) {

		var cal = icalGenerator();

		cal.setDomain('echomanchester.net')
			.setName('Echo Manchester')
			.setTZ("Europe/London")
			.setProdID({
				company: "Chamber Products",
				product: "Echo",
				language: "EN"
			})
			.setTTL('PT12H');

		events.forEach(function(event) {
			var start = moment(event.startdt);
			var end = event.enddt ? moment(event.enddt) : null;

			cal.addEvent({
				uid: event.id,
				tz: "Europe/London",
				start: start.toDate(),
				end: end ? end.toDate() : undefined,
				summary: event.title,
				description: event.blurb,
				location: event.location,
				url: event.url || undefined,
			});
		});

		cal.serve(res);
	});
});

module.exports = router;
