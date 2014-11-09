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

	var start = req.query.startts || today();
	if (start) {
		if (isNumber(start))
			clauses.push("startdt >= datetime(" + start + ", 'unixepoch')");
	}

	var end = req.query.endts || inMonths(3);
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

	models.Event.findAll({
		where: clauses.join(" AND "),
		attributes: [ "id", "title", "startdt", "enddt", "location", "blurb", "url", "cost" ],
		order: "startdt ASC",
	}, { raw: true }).success(function(events) {
		req.header("Content-Type", "application/json");
		res.send(JSON.stringify(events, null, " "));
	});
});

router.get('/ical', function(req, res) {
	var models = req.app.get('models');
	var sequelize = models.sequelize;

	var clauses = parseOpts(req);

	models.Event.findAll({
		where: clauses.join(" AND "),
		attributes: [ "id", "title", "startdt", "enddt", "location", "blurb", "url", "cost" ],
		order: "startdt ASC",
	}, { raw: true }).success(function(events) {

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
