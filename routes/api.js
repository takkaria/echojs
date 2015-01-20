var express = require('express');
var router = express.Router();

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
	var models = req.app.get('models');
	var sequelize = models.sequelize;

	var clauses = parseOpts(req);

	// This particular kind of JSON output is designed to be suitable input
	// to FullCalendar.

	models.Event.findAll({
		where: clauses.join(" AND "),
		// XXX could we SELECT enddt AS end here instead of rewriting it later?
		attributes: [ "id", "title", "startdt", "enddt", "location_text", "blurb", "url", "cost" ],
		order: "startdt ASC",
	}, { raw: true }).then(function(events) {
		req.header("Content-Type", "application/json");

		events.forEach(function(event) {
			event.start = event.startdt;
			event.end = event.enddt;
			event.startdt = undefined;
			event.enddt = undefined;
		});

		res.send(JSON.stringify(events, null, " "));
	});
});

router.get('/json/locations', function(req, res) {
	var models = req.app.get('models');
	var sequelize = models.sequelize;

	models.Location
		.findAll({ attributes: [ "id", "name", "address" ] }, { raw: true })
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
	var models = req.app.get('models');
	var sequelize = models.sequelize;

	var clauses = parseOpts(req);

	models.Event.findAll({
		where: clauses.join(" AND "),
		attributes: [ "id", "title", "startdt", "enddt", "location", "blurb", "url", "cost", "host" ],
		order: "startdt ASC",
	}, { raw: true }).then(function(events) {

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
