'use strict';

const express = require('express');
const all = require('promise-all');
const moment = require('moment');
const models = require('../models');
const ensure = require('../lib/ensure');

const router = express.Router();
const Sequelize = models.db;
const stats = models.Stats;

function eventsPerState() {
	return Sequelize.query(
		'SELECT state, count(state) AS num FROM events GROUP BY state'
	).then(result => {
		let stats = {
			submitted: 0,
			imported: 0
		};
		for (let item of result[0]) {
			stats[item.state] = item.num;
		}
		return stats;
	})
}

function eventsComingUp() {
	return Sequelize.query(
		'SELECT count(*) AS num FROM events WHERE startdt >= date() AND state="approved"'
	).then(result => result[0][0].num);
}

function numFeedErrors() {
	return Sequelize.query(
		'SELECT COUNT(id) AS total, COUNT(errors) AS errors FROM feeds'
	).then(result => result[0][0]);
}

function numLocations() {
	return Sequelize.query(
		'SELECT COUNT(*) AS total FROM locations'
	).then(result => result[0][0]);
}

function lastNewsletterSent() {
	return stats.getValue('newsletterLastSent').then(val => {
		if (!val) {
			return {
				number: 'never',
				text: 'sent',
				warning: true
			};
		} else {
			let lastSent = moment(val)
			let date = moment().from(lastSent, true).split(' ');
			return {
				number: typeof date[0] === 'string' ? 1 : date[0],
				text: date[1] + ' ago',
				warning: lastSent.isAfter(moment().add(1, 'month'))
			};
		}
	});
}

router.get('/', ensure.editorOrAdmin, function(req, res) {
	all({
		events: eventsPerState(),
		eventsComingUp: eventsComingUp(),
		feeds: numFeedErrors(),
		locations: numLocations(),
		lastNewsletterSent: lastNewsletterSent()
	}).then(stats =>
		res.render('admin', {
			user: req.user,
			stats: stats
		})
	);
});

router.use('/user', require('./admin/user'));
router.use('/event', require('./admin/event'));
router.use('/events', require('./admin/events'));
router.use('/locations', require('./admin/location'));
router.use('/feeds', require('./admin/feeds'));
router.use('/newsletter', require('./admin/newsletter'));

module.exports = router;
