var express = require('express');
var moment = require('moment');
var mailer = require('../lib/mailer');
var debug = require('debug')('echo:event');
var router = express.Router();
var models = require('../models');

router.param('id', function(req, res, next, id) {
	models.Event.findOne({
		include: [ models.Location ],
		where: {
			id: id,
			state: 'approved'
		}
	}).then(function(event_) {
		req.event_ = event_;
		next(!event_ ? new Error('No such event') : null);
	});
});

router.param('slug', function(req, res, next, slug) {
	models.Event.find({
		include: [ models.Location ],
		where: { slug: slug }
	}).then(function(event_) {
		req.event_ = event_;
		next(!event_ ? new Error('No such event') : null);
	});
});

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

function parseDateTime(data, field) {
	var date;

	// 1. We parse with strict mode to prevent blank enddt being taken as "now"
	// 2. This means that if moment can't find a time, it marks the date as invalid.
	//    So we have to use an alternative parse string for all-day events.

	// Start/end date parsing could be made better, so that we return the data
	// the user entered instead of blanks when the dates don't parse. XXX

	if (data.allday) {
		date = moment(data[field], 'YYYY/MM/DD', true);
	} else {
		date = moment(data[field], 'YYYY/MM/DD HH:mm', true);
	}

	return date.isValid() ? date : null;
}

// POST /event/add
//
// This code is shared with routes/admin/event.js
// Should have an Event.buildFromData(). XXX
router.post('/add', function(req, res) {
	var data = req.body;

	data.startdt = parseDateTime(data, 'startdt');
	data.enddt = parseDateTime(data, 'enddt');

	// If the end date and start date are the same and we're doing 'all day',
	// nuke the end date.
	if (data.allday && data.startdt.isSame(data.enddt, 'day'))
		data.enddt = null;

	var evt = models.Event.build({
		title:         data.title,
		startdt:       data.startdt,
		enddt:         data.enddt,
		allday:        data.allday ? true : false,
		blurb:         data.blurb,
		location_text: data.location_text,
		host:          data.host,
		type:          '',
		email:         data.email,
		state:         defaultState(req)
	});

	if (data.edit) {
		// Just render the event data back
		res.render('event_add', {
			event_: evt,
			user: req.user
		});
	} else {
		evt.save().then(function setID(evt) {
			// Must be called post-save to get ID property
			evt.generateSlug();
			if (data.location_id) {
				evt.setLocation(data.location_id);
			}

			// If we have an ID that works, erase the text
			if (evt.location_id) {
				evt.location_text = null;
			}

			return evt.save();
		}).then(function notify(evt) {
			if (evt.state === 'approved') {
				req.flash('success', 'Event added and approved.');
				return res.redirect(evt.absoluteURL);
			}

			req.flash('success', "Event successfully added; you'll get an e-mail when a moderator has looked at it");

			mailer.sendEventSubmittedMail(evt);
			mailer.sendAdminsEventNotifyMail(models, evt);

			return res.redirect('/events');
		}).catch(function(errors) {
			debug(errors, evt, data);
			res.render('event_add', {
				event_: evt,
				errors: errors.errors,
				user: req.user
			});
		});
	}
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

function findOtherEventsByLocation(event_, cb) {
	var params = [];
	if (event_.location_id)
		params.push({ location_id: event_.location_id });
	else if (event_.location_text)
		params.push({ location_text: event_.location_text });
	else
		return Promise.resolve(null);

	return models.Event.findAll({
		where: [
			{ id: { $ne: event_.id } },
			{ $or: params },
			[ "(startdt >= date('now', 'start of day') OR date('now') <= enddt)", [] ]
		],
		order: 'startdt'
	});
}

function findOtherEventsByHost(event_, cb) {
	if (!event_.host)
		return Promise.resolve(null);

	return models.Event.findAll({
		where: [
			{ id: { $ne: event_.id } },
			{ host: event_.host },
			[ "(startdt >= date('now', 'start of day') OR date('now') <= enddt)", [] ]
		],
		order: 'startdt'
	});
}

/* GET event by slug */
router.get('/:year/:month/:slug', function(req, res) {
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
	});
});

module.exports = router;
