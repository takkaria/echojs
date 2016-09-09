'use strict';

var express = require('express');
var moment = require('moment');
var notify = require('../lib/notify');
var debug = require('debug')('echo:event');
var router = express.Router();
var models = require('../models');
var Sequelize = models.db;

router.param('id', function(req, res, next, id) {
	models.Event.findOne({
		include: [ models.Location ],
		where: {
			id: id,
			state: 'approved'
		}
	}).then(function(event_) {
		if (event_) {
			req.event_ = event_;
			next();
		} else {
			res.status(404);
			res.render('404', { thing: 'event' });
		}
	});
});

router.param('slug', function(req, res, next, slug) {
	models.Event.find({
		include: [ models.Location ],
		where: {
			slug: slug,
			state: 'approved'
		}
	}).then(function(event_) {
		if (event_) {
			req.event_ = event_;
			next();
		} else {
			res.status(404);
			res.render('404', { thing: 'event' });
		}
	});
});

/* GET event add */
router.get('/add', function(req, res) {
	if (req.user) {
		// var is hoisted
		var fakeEvent = {
			email: req.user.email
		};
	}

	res.render('event_add', {
		user: req.user,
		event_: fakeEvent
	});
});

function defaultState(req) {
	if (req.isAuthenticated() &&
			(req.user.rights === 'editor' || req.user.rights === 'admin')) {
		return 'approved';
	}

	return 'submitted';
}

function parseDateTime(str, allday) {
	var date;

	// 1. We parse with strict mode to prevent blank enddt being taken as "now"
	// 2. This means that if moment can't find a time, it marks the date as invalid.
	//    So we have to use an alternative parse string for all-day events.

	// Start/end date parsing could be made better, so that we return the data
	// the user entered instead of blanks when the dates don't parse. XXX

	if (allday) {
		date = moment(str, 'YYYY/MM/DD', true);
	} else {
		date = moment(str, 'YYYY/MM/DD HH:mm', true);
	}

	if (date.isValid())
		return date;
}

function buildEventFromReq(req) {
	const nullifyEmptyString = (str) => (str === '' ? null : str);

	const input = req.body;
	let data = {
		title: input.title,
		startdt: parseDateTime(input.startdt, input.allday),
		enddt: parseDateTime(input.enddt, input.allday),
		allday: input.allday ? true : false,
		blurb: input.blurb,
		location_text: input.location_text,
		host: input.host,
		url: nullifyEmptyString(input.url),
		type: '',
		email: input.email,
		state: defaultState(req)
	};

	// If the end date and start date are the same and we're doing 'all day',
	// nuke the end date.
	if (data.allday && data.startdt.isSame(data.enddt, 'day'))
		data.enddt = null;

	return data;
}

function fixErrors(errors) {
	// This is a nasty hack, because we can't customise the error message
	// for this particular case.
	//
	// Other fields when set to { allowNull: false } in
	// the model don't emit an error in the form '<field> cannot be
	// null'; instead the error message when they are missing is caused
	// by the validation options set in the model.  For some reason
	// startdt behaves differently, perhaps because it's a date type
	// field.  Investigate more and report upstream.    XXX
	for (let error of errors) {
		if (error.message === 'startdt cannot be null')
			error.message = 'Events must have a start date';
	}

	return errors;
}

// POST /event/add
//
// This code is shared with routes/admin/event.js
// Should have an Event.buildFromData(). XXX
router.post('/add', function(req, res, next) {
	const input = req.body;

	// Just render the input back if the edit bit is set
	if (input.edit) {
		if (!input.email && req.user) {
			input.email = req.user.email;
		}

		return res.render('event_add', {
			event_: input,
			user: req.user
		});
	}

	let data = buildEventFromReq(req);
	let evt = models.Event.build(data);

	evt.validate().then(function(errors) {
		if (errors) {
			return res.render('event_add', {
				event_: input,
				errors: fixErrors(errors.errors),
				user: req.user
			});
		}

		return evt.save().then(function fixLocationInfo(evt) {
			if (data.location_id) {
				// Sequelize handles this with a separate UPDATE statement
				return evt
					.setLocation(data.location_id)
					.then(function(evt) {
						// If we have a valid location ID, erase the text
						if (evt.location_id) {
							evt.location_text = null;
						}
						return evt;
					});
			} else {
				return evt;
			}
		}).then(function addSlug(evt) {
			evt.generateSlug();
			// Save the slug and/or any removed location textual description
			return evt.save();
		}).then(function(evt) {
			notify.eventSubmitted(evt);

			if (evt.state === 'approved') {
				req.flash('success', 'Event added and approved.');
				return res.redirect(evt.absoluteURL);
			}

			req.flash('success', "<b>Event submitted.</b> Please wait until our moderators check it.");

			return res.redirect('/');
		});
	}).catch(next);
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

	debug(req.event_.absoluteURL);
	res.redirect(req.event_.absoluteURL);
});

function findOtherEventsByLocation(event_) {
	let where = {
		id: { $ne: event_.id },
		state: 'approved',
		$or: {
			startdt: { $gte: Sequelize.fn('date', 'now', 'start of day') },
			enddt: { $gte: Sequelize.fn('date', 'now') }
		}
	};

	if (event_.location_id)
		where.location_id = event_.location_id;
	else if (event_.location_text)
		where.location_text = event_.location_text;
	else
		return Promise.resolve(null);

	return models.Event.findAll({
		where: where,
		order: 'startdt'
	});
}

function findOtherEventsByHost(event_) {
	if (!event_.host)
		return Promise.resolve(null);

	return models.Event.findAll({
		where: {
			id: { $ne: event_.id },
			host: event_.host,
			state: 'approved',
			$or: {
				startdt: { $gte: Sequelize.fn('date', 'now', 'start of day') },
				enddt: { $gte: Sequelize.fn('date', 'now') }
			}
		},
		order: 'startdt'
	});
}

/* GET event by slug */
router.get('/:year/:month/:slug', function(req, res, next) {
	var event_ = req.event_;

	Promise.all([
		findOtherEventsByLocation(event_),
		findOtherEventsByHost(event_)
	]).then(function(results) {
		var evtsThisLocation = results[0];
		var evtsThisHost = results[1];

		res.render('event_page', {
			event_: req.event_,
			user: req.user,
			otherEventsLocation: evtsThisLocation,
			otherEventsHost: evtsThisHost
		});
	}).catch(next);
});

module.exports = router;
