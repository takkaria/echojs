'use strict';

const moment = require('moment');

const express = require('express');
const router = express.Router();

const mail = require('../../lib/mail');
const ensure = require('../../lib/ensure');
const models = require('../../models');
const Sequelize = models.db;

function processForm(req, cb) {
	const dateFormat = 'YYYY-MM-DD';

	let data = {
		subject: req.body.subject,
		startdt: moment(req.body.startdt),
		enddt: moment(req.body.enddt),
		body: req.body.body
	};

	models.Event.groupByDays({
		where: {
			state: 'approved',
			startdt: {
				$gte: Sequelize.fn('date', data.startdt.format(dateFormat), 'localtime'),
				$lte: Sequelize.fn('date', data.enddt.format(dateFormat), 'localtime'),
			}
		},
		order: 'startdt ASC'
	}).then((evts) => {
		data.events = evts;
		cb(null, data);
	}).catch((err) => cb(err));
}

router.get('/', ensure.editorOrAdmin, function(req, res) {
	let nextMonthStart = moment().startOf('month').add(1, 'month');

	res.render('admin_newsletter', {
		startdt: nextMonthStart.format('YYYY-MM-DD'),
		enddt: nextMonthStart.endOf('month').format('YYYY-MM-DD'),
		subject: nextMonthStart.format('MMMM') + ' newsletter'
	})
})

router.post('/preview', ensure.editorOrAdmin, function(req, res) {
	processForm(req, (err, data) => {
		res.render('mail/events_newsletter', data);
	})
})

router.post('/send', ensure.editorOrAdmin, function(req, res) {
	processForm(req, (err, data) => {
		mail.sendMail({
			template: 'events_newsletter.html',
			subject: data.subject,
			to: 'echomanchester@lists.riseup.net',
			context: data
		})

		res.send('Sent');
	})
})

module.exports = router;
