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

function canApproveOrReject(req, res, next) {
	if (req.event_.state === 'approved' || req.event_.state === 'hidden') {
		res.redirect('/admin/' + req.event_.id);
	} else {
		return next();
	}
}

router.get('/:event_id/approve', ensure.editorOrAdmin, canApproveOrReject, function(req, res) {
	var event_ = req.event_;
	res.render('event_approve', {
		event_: event_,
		user: req.user
	});
});

router.post('/:event_id/approve', ensure.editorOrAdmin, canApproveOrReject, function(req, res) {
	var event_ = req.event_;
	event_.set('state', 'approved');
	event_.generateSlug();
	event_.save().then(function(e) {
		e.reload().then(function() {
			req.flash('success', 'Event <a href="%s">%s</a> approved',
								event_.absolute_url, event_.id);
			if (!e.isImported())
				mailer.sendEventApprovedMail(event_);
			res.redirect(e.absolute_url);
		})
	})
	.catch(function(errors){
		debug(errors);
	});
});

router.get('/:event_id/reject', ensure.editorOrAdmin, canApproveOrReject, function(req, res) {
	var event_ = req.event_;
	res.render('event_reject', {
		event_: req.event_,
		user: req.user
	});
});

router.post('/:event_id/reject', ensure.editorOrAdmin, canApproveOrReject, function(req, res) {
	var event_ = req.event_;
	var msg = req.body.reason;

	var sendEmail = req.body.email ? true : false;

	if (sendEmail && !msg) {
		res.render('event_reject', {
			event_: req.event_,
			user: req.user,
			data: req.body,
			errors: [ {
				path: 'reason',
				message: 'Please provide a reason.'
			} ]
		})
		return;
	}

	event_.set('state', 'hidden');
	event_.save({ validate: false }).then(function() {
		if (sendEmail)
			mailer.sendEventRejectedMail(event_, msg);

		req.flash('warning', 'Event <a href="%s">%s</a> hidden%s',
							event_.absolute_url, event_.id,
							!sendEmail ? " (no email sent)": "");
		res.redirect('/admin');
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

	b.startdt = moment(b.startdt, 'YYYY/MM/DD hh:mm')
	// strict mode to prevent blank enddt being taken as "now"
	b.enddt = moment(b.enddt, 'YYYY/MM/DD hh:mm', true)
	if (!b.enddt.isValid()) {
		b.enddt = null;
	}

	// Only one of (id, text) can be stored
	if (b.location_id) {
		b.location_text = null;
	}

	e.setLocation(b.location_id);
	e.set({
		title: b.title,
		startdt: b.startdt,
		enddt: b.enddt,
		blurb: b.blurb,
		location_text: b.location_text,
		host: b.host,
		type: '',
		cost: b.cost,
		email: b.email,
	});

	e
		.save({ validate: false })
		.then(function(event_) {
			req.flash('success', 'Event <a href="/admin/event/%s">%s</a> edited',
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
