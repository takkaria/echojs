var express = require('express');
var router = express.Router();
var models = require('../models');
var moment = require('moment');

router.get('/newsletter', function(req, res) {
	models.Event.groupByDays({
		where: [
			{ state: "approved" },
			["(startdt >= date('now', 'start of day') OR date('now') <= enddt)", []]
		],
		order: "startdt ASC"
	}).then(function(evts) {
		res.render('events_newsletter', {
			events: evts,
			user: req.user
		});
	});
});

router.get('/leaflet', function(req, res) {
	models.Event.findAll({
		where: [
			{ state: "approved" },
			["(startdt >= date('now', 'start of day') OR date('now') <= enddt)", []]
		],
		order: "startdt ASC"
	}).then(function(events) {
		res.render('events_leaflet', {
			events: events,
			user: req.user
		});
	});
});

function renderEvents(req, res) {
	var startdate;

	if (req.url === "/") {
		// Use today's date
		startdate = moment();
	} else {
		// Parse using moment's string parser - probably a bit too liberal
		// but should be OK
		startdate = moment(
				req.params.year + " " + req.params.month,
				"YYYY MMM");

		// Redirect to base page in case of invalid result
		if (!startdate.isValid()) {
			return res.redirect("/events");
		}
	}

	var startFmt = startdate.startOf('month').format('YYYY-MM-DD');
	var endFmt = startdate.endOf('month').format('YYYY-MM-DD');

	// Fetch data for this month
	models.Event.findAll({
		where: [
			{ state: "approved" },
			["startdt >= '" + startFmt + "' AND startdt <= '" + endFmt + "'", []]
		],
		order: "startdt ASC"
	}).then(function(events) {
		// XXX Handle errors

		res.render('events', {
			events: events,
			month: startdate,
			user: req.user
		});
	});
}

/* GET events */
router.get('/:year/:month', renderEvents);
router.get('/', renderEvents);

module.exports = router;
