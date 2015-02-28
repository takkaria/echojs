var express = require('express');
var router = express.Router();
var models = require('../models');

router.get('/newsletter', function(req, res) {
	models.Event.groupByDays({
		where: [
			{ state: "approved" },
			"(startdt >= date('now', 'start of day') OR date('now') <= enddt)"
		],
		order: "startdt ASC"
	}, function(ordered) {
		res.render('events_newsletter', {
			events: ordered,
			user: req.user
		});
	});
});

router.get('/leaflet', function(req, res) {
	models.Event.findAll({
		where: [
			{ state: "approved" },
			"(startdt >= date('now', 'start of day') OR date('now') <= enddt)"
		],
		order: "startdt ASC"
	}).then(function(events) {
		res.render('events_leaflet', {
			events: events,
			user: req.user
		});
	});
});

/* GET events */
router.get('/*', function(req, res) {
	res.render('events', { user: req.user });
});

module.exports = router;
