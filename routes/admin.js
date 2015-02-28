var express = require('express');
var moment = require('moment');
var debug = require('debug')('echo:admin');
var mailer = require('../lib/mailer');
var router = express.Router();
var models = require('../models');

function ensureAuthenticated(req, res, next) {
	if (req.isAuthenticated()) { return next(); }
	res.redirect('/user/login?next=' + encodeURIComponent(req.originalUrl));
}

function ensureEditorOrAdmin(req, res, next) {
	ensureAuthenticated(req, res, function() {
		if (req.user.rights === 'admin' || req.user.rights == 'editor') {
			return next()
		}
		req.flash('danger', 'Computer says no');
		res.redirect('/');
	});
}

function ensureAdmin(req, res, next) {
	ensureAuthenticated(req, res, function() {
		if (req.user.rights === 'admin') {
			return next()
		}
		req.flash('danger', 'Computer says no');
		res.redirect('/admin');
	});
}

router.param('event_id', function(req, res, next, event_id) {
	models.Event.find({
		include: [ models.Location ],
		where: { id: event_id }
	}).then(function(event_) {
		req.event_ = event_;
		next(!event_ ? new Error("No such event") : null);
	});
})

router.param('user_id', function(req, res, next, user_id) {
	models.User.find({
		where: { id: user_id }
	}).then(function(user) {
		req.user_obj = user;
		next(!user ? new Error("No such user") : null);
	});
})

router.param('location_id', function(req, res, next, loc_id) {
	models.Location.find({
		where: { id: loc_id }
	}).then(function(loc) {
		req.loc = loc;
		next(!loc ? new Error("No such location") : null);
	});
})

router.get('/', ensureEditorOrAdmin, function(req, res) {
	models.Event.findAll({
		where: [
			{ state: ["submitted", "imported"] }
		],
		include: [ models.Location ],
		limit: 20,
		order: "startdt ASC"
	}).then(function(events_) {
		res.render('admin', {
			user: req.user,
			events_: events_
		});
	});
});

/////////// LOCATIONS ///////////

router.get('/locations', ensureEditorOrAdmin, function(req, res) {
	models.Location.findAll({
		limit: 20,
	}).then(function(locations) {
		res.render('locations', {
			user: req.user,
			locations: locations
		});
	});
});

router.get('/location/add', ensureEditorOrAdmin, function(req, res) {
	res.render('location_add', {
		user: req.user,
	});
});

/* POST event add */
router.post('/location/add', ensureEditorOrAdmin, function(req, res) {
	var b = req.body,
		location = {
			name: b.name,
			address: b.address,
			description: b.description,
			longitude: b.longitude,
			latitude: b.latitude
		};

	models.Location
		.create(location)
		.then(function(location) {
			req.flash('success', 'Location %s created',
					location.name);

			res.redirect("/admin/locations");
		})
		.catch(function(errors) {
			res.render('location_add', {
				loc: location,
				errors: errors.errors,
				user: req.user
			});
		});
});

router.get('/location/:location_id', ensureEditorOrAdmin, function(req, res) {
	res.render('location', {
		user: req.user,
		loc: req.loc,
	});
});

router.get('/location/:location_id/edit', ensureEditorOrAdmin, function(req, res) {
	res.render('location_edit', {
		user: req.user,
		loc: req.loc
	});
});

router.post('/location/:location_id/edit', ensureEditorOrAdmin, function(req, res) {
	var b = req.body,
		location = req.loc;

	location
		.set({
			name: b.name,
			address: b.address,
			description: b.description,
			longitude: b.longitude,
			latitude: b.latitude
		})
		.save()
		.then(function(loc) {
			req.flash('success', 'Location <a href="/admin/location/%s">%s</a> edited',
					l.id, l.name);
			res.redirect('/admin/location/' + loc.id);
		})
		.catch(function(errors) {
			debug(errors);
			res.render('location_edit', {
				errors: errors.errors,
				user: req.user,
				loc: location
			});
		});
});

router.get('/location/:location_id/delete', ensureEditorOrAdmin, function(req, res) {
	var location = req.loc;

	res.render('location_delete', {
		user: req.user,
		loc: location
	});
});

router.post('/location/:location_id/delete', ensureEditorOrAdmin, function(req, res) {
	var location = req.loc;

	location
		.destroy()
		.then(function () {
			req.flash('warning', 'Location %s deleted',
					location.name);
			res.redirect('/admin/locations');
		});
});

/////////// EVENTS ///////////

router.get('/event/:event_id', ensureEditorOrAdmin, function(req, res) {
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

router.get('/event/:event_id/approve', ensureEditorOrAdmin, canApproveOrReject, function(req, res) {
	var event_ = req.event_;
	res.render('event_approve', {
		event_: event_,
		user: req.user
	});
});

router.post('/event/:event_id/approve', ensureEditorOrAdmin, canApproveOrReject, function(req, res) {
	var event_ = req.event_;
	event_.set('state', 'approved');
	event_.generateSlug();
	event_.save().then(function(e) {
		e.reload();  // XXX surely should use a promise here?
		req.flash('success', 'Event <a href="%s">%s</a> approved', 
							event_.absolute_url, event_.id);
		if (e.isImported())
			mailer.sendEventApprovedMail(event_, msg);
		res.redirect(e.absolute_url);
	})
	.catch(function(errors){
		debug(errors);
	});
});

router.get('/event/:event_id/reject', ensureEditorOrAdmin, canApproveOrReject, function(req, res) {
	var event_ = req.event_;
	res.render('event_reject', {
		event_: req.event_,
		user: req.user
	});
});

router.post('/event/:event_id/reject', ensureEditorOrAdmin, canApproveOrReject, function(req, res) {
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

router.get('/event/:event_id/edit', ensureEditorOrAdmin, function(req, res) {
	res.render('event_edit', {
		user: req.user,
		event_: req.event_
	});
});

router.post('/event/:event_id/edit', ensureEditorOrAdmin, function(req, res) {
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

/////////// USERS ///////////

router.get('/user', ensureAdmin, function(req, res) {
	models.User.findAll({
		limit: 20,
	}).then(function(users) {
		res.render('users', {
			user: req.user,
			users: users
		});
	});
});

router.get('/user/add', ensureAdmin, function(req, res) {
	res.render('user_add', {
		user: req.user
	});
});

router.post('/user/add', ensureAdmin, function(req, res) {
	var b = req.body;
	var user_obj = models.User.build(b);

	user_obj
		.validate()
		.done(function(err, errors_) {
			var errors = typeof(errors_) === 'undefined' ? [] : errors_.errors;

			if (b.password === '' || typeof(b.password) === 'undefined') {
				errors = errors.concat([ {
					path: 'password',
					message: 'You must set a password'
				} ]);
			}

			debug(err, errors);
			debug(b.password, user_obj.digest, user_obj.salt);

			if (errors.length > 0) {
				return res.render('user_add', {
					errors: errors,
					user: req.user,
					user_obj: b
				});
			}

			user_obj.setPassword(b.password);
			user_obj.save().then(function(u) {
				req.flash('success', 'User <a href="/admin/user/%s/edit">%s</a> added',
									u.id, u.id);
				mailer.sendNewUserMail(u);
				return res.redirect('/admin/user');
			});
		});
});

router.get('/user/:user_id/edit', ensureAdmin, function(req, res) {
	res.render('user_edit', {
		user: req.user,
		user_obj: req.user_obj
	});
});

router.post('/user/:user_id/edit', ensureAdmin, function(req, res) {
	var b = req.body,
		u = req.user_obj;
	u.set({
		email: b.email,
		notify: (b.notify === 'on') ? 1 : 0,
		rights: b.rights
	});
	debug(u.changed());
	debug(b, u);
	if ((b.password !== '')&&(typeof(b.password) !== 'undefined')){
		u.setPassword(b.password);
		debug('password changed');
	}
	u.save().then(function(u_) {
		req.flash('success', 'User <a href="/admin/user/%s/edit">%s</a> saved', 
							u_.id, u_.id);
		res.redirect('/admin/user');
	}).catch(function(errors) {
		debug(errors);
		res.render('user_edit', {
			errors: errors.errors,
			user: req.user,
			user_obj: u
		});
	});
});

router.get('/user/:user_id/delete', ensureAdmin, function(req, res) {
	res.render('user_delete', {
		user: req.user,
		user_obj: req.user_obj
	});
});

router.post('/user/:user_id/delete', ensureAdmin, function(req, res) {
	req.user_obj.destroy().then(function(){
		req.flash('warning', 'User deleted');
		return res.redirect('/admin');
	});
});

module.exports = router;
