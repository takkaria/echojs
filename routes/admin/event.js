var express = require('express');
var router = express.Router();
var models = require('../../models');
var moment = require('moment');
var debug = require('debug')('echo:admin');
var mailer = require('../../lib/mailer');
var ensure = require("../../lib/ensure");

router.param('event_id', function(req, res, next, event_id) {
	models.Event.find({
		include: [ models.Location ],
		where: { id: event_id }
	}).then(function(event_) {
		req.event_ = event_;
		next(!event_ ? new Error("No such event") : null);
	});
});

router.get('/:event_id', ensure.editorOrAdmin, function(req, res) {
	res.render('event_page', {
		event_: req.event_,
		user: req.user
	});
});

function approveEvent(req, res, event_, next_) {
	event_.set('state', 'approved');
	event_.generateSlug();
	event_.save().then(function(e) {
		return e.reload();
	}).then(function() {
		req.flash('success',
				'Event <a href="%s">%s</a> approved. <a href="/admin/event/%s/reject">Hide event instead?</a>',
				event_.absolute_url, event_.id, event_.id);
		if (!event_.isImported()) {
			mailer.sendEventApprovedMail(event_);
		}

		res.redirect(next_ ? next_ : event_.absolute_url);
	}).catch(function(errors){
		debug(errors);
	});
}

router.get('/:event_id/approve', ensure.editorOrAdmin, function(req, res) {
	var event_ = req.event_,
		next = req.query.next ? req.query.next : '',
		instant = req.query.instant ? true : false;

	if (instant) {
		approveEvent(req, res, event_, next);
	} else {
		res.render('event_approve', {
			event_: event_,
			user: req.user,
			next: next
		});
	}
});

router.post('/:event_id/approve', ensure.editorOrAdmin, function(req, res) {
	var event_ = req.event_,
		next = req.body.next;

	approveEvent(req, res, event_, next);
});

router.get('/:event_id/reject', ensure.editorOrAdmin, function(req, res) {
	var next = req.query.next ? req.query.next : '';
	res.render('event_reject', {
		event_: req.event_,
		user: req.user,
		next: next
	});
});

router.post('/:event_id/reject', ensure.editorOrAdmin, function(req, res) {
	var event_ = req.event_,
		next_ = req.body.next_;
	var msg = req.body.reason;

	var sendEmail = req.body.email ? true : false;

	if (sendEmail && !msg) {
		return res.render('event_reject', {
			event_: req.event_,
			user: req.user,
			data: req.body,
			errors: [ {
				path: 'reason',
				message: 'Please provide a reason.'
			} ]
		});
	}

	event_.set('state', 'hidden');
	event_.save({ validate: false }).then(function() {
		if (sendEmail)
			mailer.sendEventRejectedMail(event_, msg);

		req.flash('warning', 'Event <a href="%s">%s</a> hidden%s. <a href="/admin/event/%s/approve">Show event instead?</a>',
				event_.absolute_url, event_.id,
				!sendEmail ? " (no email sent)": "",
				event_.id);
		res.redirect(next_ ? next_ : event_.absolute_url);
	})
	.catch(function(errors){
		debug(errors);
	});
});

router.get('/:event_id/edit', ensure.editorOrAdmin, function(req, res) {
	res.render('event_edit', {
		user: req.user,
		event_: req.event_
	});
});

router.post('/:event_id/edit', ensure.editorOrAdmin, function(req, res) {
	var b = req.body,
		e = req.event_;

	// We parse start dates loosely because it reduces the chance of data loss
	b.startdt = moment(b.startdt, 'YYYY/MM/DD HH:mm');

	// End dates need more care.
	// 1. We parse with strict mode to prevent blank enddt being taken as "now"
	// 2. This means that if moment can't find a time, it marks the date as invalid.
	//    So we have to use an alternative parse string for all-day events.
	if (b.allday) {
		b.enddt = moment(b.enddt, 'YYYY/MM/DD', true);
	} else {
		b.enddt = moment(b.enddt, 'YYYY/MM/DD HH:mm', true);
	}

	if (!b.enddt.isValid()) b.enddt = null;

	// If the end date and start date are the same and we're doing 'all day',
	// nuke the end date.
	if (b.allday && b.startdt.isSame(b.enddt, 'day'))
		b.enddt = null;

	// Only one of (id, text) can be stored
	if (b.location_id) b.location_text = null;

	e.setLocation(b.location_id);
	e.set({
		title: b.title,
		startdt: b.startdt,
		enddt: b.enddt,
		allday: b.allday ? true : false,
		blurb: b.blurb,
		location_text: b.location_text,
		host: b.host,
		type: '',
		email: b.email,
	});

	e
		.save({ validate: false })
		.then(function(event_) {
			req.flash('success', 'Event <a href="/admin/event/%s">%s</a> edited.',
								event_.id, event_.slug);
			res.redirect('/admin/event/' + event_.id);
		})
		.catch(function(errors) {
			debug(errors);
			res.render('event_edit', {
				errors: errors.errors,
				user: req.user,
				event_: e
			});
		});
});

module.exports = router;
