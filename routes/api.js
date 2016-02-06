'use strict';

var express = require('express');
var router = express.Router();

var models = require('../models');
var Sequelize = models.db;

var ical = require('ical-generator');
var moment = require('moment');

router.get('/', function(req, res) {
	res.send('try .../json or .../ical');
});

function parseOpts(req) {
	const dateFormat = 'YYYY-MM-DD';

	let start = moment(req.query.start, dateFormat);
	if (!start.isValid()) {
		start.set(new Date());
	}

	let end = moment(req.query.end, dateFormat);
	if (!end.isValid()) {
		end.set(new Date()).add(3, 'months');
	}

	return {
		state: 'approved',
		startdt: {
			$gte: Sequelize.fn('date', start.format(dateFormat), 'localtime'),
			$lte: Sequelize.fn('date', end.format(dateFormat), 'localtime'),
		}
	}
}

router.get('/json', function(req, res) {
	const clauses = parseOpts(req);

	// This particular kind of JSON output is designed to be suitable input
	// to FullCalendar.

	models.Event.findAll({
		where: clauses,
		attributes: [ 'id', 'title', 'startdt', 'enddt' ],
		order: 'startdt ASC',
	}).then(function(events) {
		let data = events.map(e =>
			({ id: e.id, title: e.title, start: e.startdt, end: e.enddt })
		);

		res.header('Content-Type', 'application/json');
		res.send(JSON.stringify(data, ' '));
	}).catch(function(err) {
		res.status(500).end();
	});
});

router.get('/json/locations', function(req, res) {
	models.Location.findAll({
		attributes: [ 'id', 'name', 'address' ]
	}).then(function(locations) {
		req.header('Content-Type', 'application/json');

		for (let location of locations) {
			// FIXME: Maybe do this client-side
			location.address = location.address.replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1, ');
		}

		res.send(JSON.stringify(locations, null, ' '));
	}).catch(function(err) {
		res.status(500).end();
	});
});

function generateCalendar(events) {
	let cal = ical({
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

	for (let evt of events) {
		cal.createEvent({
			uid: evt.id,
			timezone: 'Europe/London',
			start: evt.startdt.toDate(),
			end: evt.enddt ? evt.enddt.toDate() : undefined,
			allDay: evt.allday,
			summary: evt.title,
			description: evt.blurb,
			location: evt.location,
			url: evt.url || undefined,
		});
	}

	return cal;
}

router.get('/ical', function(req, res) {
	const clauses = parseOpts(req);

	models.Event.findAll({
		where: clauses,
		attributes: [ 'id', 'title', 'startdt', 'enddt', 'location_text', 'blurb', 'url', 'host' ],
		order: 'startdt ASC',
	}).then(function(events) {
		let cal = generateCalendar(events);
		cal.serve(res);
	}).catch(function(err) {
		res.status(500).end();
	});
});

module.exports = router;
