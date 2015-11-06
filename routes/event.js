var express = require('express');
var moment = require('moment');
var mailer = require('../lib/mailer');
var debug = require('debug')('echo:event');
var router = express.Router();
var models = require('../models');
var async = require('async');

router.param('id', function(req, res, next, id) {
	models.Event.findOne({
		include: [ models.Location ],
		where: {
			id: id,
			state: 'approved'
		}
	}).then(function(event_) {
		req.event_ = event_;
		next(!event_ ? new Error("No such event") : null);
	});
})

router.param('slug', function(req, res, next, slug) {
	models.Event.find({
		include: [ models.Location ],
		where: { slug: slug }
	}).then(function(event_) {
		req.event_ = event_;
		next(!event_ ? new Error("No such event") : null);
	});
})

/* GET event add */
router.get('/add', function(req, res) {
	res.render('event_add', {
		user: req.user
	});
});

function defaultState(req) {
	if (req.isAuthenticated() &&
			(req.user.rights === 'editor' || req.user.rights === 'admin')) {
		return 'approved';
	}

	return 'submitted';
}

/* POST event add */
router.post('/add', function(req, res) {
	var b = req.body;

	// This code is shared with routes/admin/event.js. XXX

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


	var event_ = models.Event.build({
		title: b.title,
		startdt: b.startdt,
		enddt: b.enddt,
		allday: b.allday ? true : false,
		blurb: b.blurb,
		location_text: b.location_text,
		host: b.host,
		type: '',
		cost: b.cost,
		email: b.email,
		state: defaultState(req)
	});

	event_.save().then(function(e_) {
		// Must be called post-save to get ID property
		e_.generateSlug();
		if (b.location_id) {
			event_.setLocation(b.location_id);
		}

		// If we have an ID that works, erase the text
		if (e_.location_id) {
			e_.location_text = null;
		}

		e_.save().then(function(e_) {
			if (e_.state === 'approved') {
				req.flash('success', 'Event added and approved.');
				return res.redirect(e_.absolute_url);
			}

			req.flash('success', 'Event successfully added; you\'ll get an e-mail when a moderator has looked at it');

			mailer.sendEventSubmittedMail(event_);
			mailer.sendAdminsEventNotifyMail(models, event_);

			return res.redirect('/events');
		});
	})
	.catch(function(errors) {
		debug(errors, event_, b);
		res.render('event_add', {
			event_: event_,
			errors: errors.errors,
			user: req.user
		});
	});
});

/* GET event by ID */
router.get('/:id', function(req, res) {

	// Serve XHR requests an event card
	if (req.xhr) {
		return res.render('event_xhr', {
			event_: req.event_,
			user: req.user
		});
	}

	debug(req.event_.absolute_url);
	res.redirect(req.event_.absolute_url);
});

/* GET event by slug */
router.get('/:year/:month/:slug', function(req, res) {
	var event_ = req.event_;

	async.parallel({
			location: function findOtherEventsByLocation(cb) {
				var params = [];
				if (event_.location_id)
					params.push({ location_id: req.event_.location_id });
				if (event_.location_text)
					params.push({ location_text: req.event_.location_text });

				if (params.length == 0) {
					cb(null, null);
				} else {
					models.Event.findAll({
						where: [
							{ id: { $ne: event_.id } },
							{ $or: params },
							["(startdt >= date('now', 'start of day') OR date('now') <= enddt)", []]
						],
						order: "startdt"
					}).then(function(evs) {
						cb(null, evs);
					});
				}
			},

			host: function findOtherEventsByHost(cb) {
				if (!event_.host) {
					cb(null, null);
				} else {
					models.Event.findAll({
						where: [
							{ id: { $ne: event_.id } },
							{ host: event_.host },
							["(startdt >= date('now', 'start of day') OR date('now') <= enddt)", []]
						],
						order: "startdt"
					}).then(function(evs) {
						cb(null, evs);
					});
				}
			}
		},

		function(err, results) {
			res.render('event_page', {
				event_: req.event_,
				user: req.user,
				otherEventsLocation: results.location,
				otherEventsHost: results.host
			});
		});
});

module.exports = router;
