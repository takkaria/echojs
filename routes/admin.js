var express = require('express'),
	moment = require('moment'),
	router = express.Router();

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/user/login?next=' + encodeURIComponent(req.originalUrl))
}


router.param('event_id', function(req, res, next, event_id) {
	var models = req.app.get('models');

	models.Event.find(event_id).then(function(event_) {
		if (!event_)
			return next(new Error("No such event"));

		req.event_ = event_;
	}).then(next, function (err) {
		next(err);
	});
})

router.param('user_id', function(req, res, next, user_id) {
	var models = req.app.get('models');

	models.User.find({
		where: { id: user_id }
	}).then(function(user) {
		if (!user)
			return next(new Error("No such user"));

		req.user_obj = user;
	}).then(next, function (err) {
		next(err);
	});
})

router.get('/', ensureAuthenticated, function(req, res) {
	var models = req.app.get('models');

	models.Event.findAll({
		where: [
			{ state: ["submitted", "imported"] }
		],
		limit: 20,
		order: "startdt ASC"
	}).then(function(events_) {
		res.render('admin', {
			user: req.user,
			events_: events_
		});
	});
});

router.get('/event/:event_id', ensureAuthenticated, function(req, res) {
	res.render('event_page', {
		event_: req.event_,
		user: req.user
	});
});

router.get('/event/:event_id/approve', ensureAuthenticated, function(req, res) {
	var event_ = req.event_;
	if ((event_.state === 'approved')||(event_.state === 'hidden')) {
		res.redirect('/admin/' + req.event_.id);
	}
	res.render('event_approve', {
		event_: event_,
		user: req.user
	});
});

router.post('/event/:event_id/approve', ensureAuthenticated, function(req, res) {
	var event_ = req.event_;
	if ((event_.state === 'approved')||(event_.state === 'hidden')) {
		res.redirect('/admin/' + req.event_.id);
	}
	event_.set('state', 'approved');
	event_.generateSlug();
	event_.save().then(function(){
		event_.reload();
		res.redirect('/event/' + event_.id);  // FIXME should be event_.absolute_url
	})
	.catch(function(errors){
		console.log(errors);
	});
});

router.get('/event/:event_id/reject', ensureAuthenticated, function(req, res) {
	var event_ = req.event_;
	if ((event_.state === 'approved')||(event_.state === 'hidden')) {
		res.redirect('/admin/' + req.event_.id);
	}
	res.render('event_reject', {
		event_: req.event_,
		user: req.user
	});
});

router.post('/event/:event_id/reject', ensureAuthenticated, function(req, res) {
	var event_ = req.event_;
	if ((event_.state === 'approved')||(event_.state === 'hidden')) {
		res.redirect('/admin/' + req.event_.id);
	}
	event_.set('state', 'hidden');
	event_.save().then(function(){
		res.redirect('/admin');
	})
	.catch(function(errors){
		console.log(errors);
	});
});

router.get('/user', ensureAuthenticated, function(req, res) {
	if (req.user.rights !== 'admin') {
		return res.redirect('/admin');
	}
	var models = req.app.get('models');

	models.User.findAll({
		limit: 20,
	}).then(function(users) {
		res.render('users', {
			user: req.user,
			users: users
		});
	});
});

router.get('/user/add', ensureAuthenticated, function(req, res) {
	if (req.user.rights !== 'admin') {
		return res.redirect('/admin');
	}
	res.render('user_add', {
		user: req.user
	});
});

router.post('/user/add', ensureAuthenticated, function(req, res) {
	if (req.user.rights !== 'admin') {
		return res.redirect('/admin');
	}

	var b = req.body,
		models = req.app.get('models'),
		extra_errors = [];

	if ((b.password === '')||(typeof(b.password) === 'undefined')){
		extra_errors = [
			{
				path: 'password',
				message: 'You must set a password'
			}
		];
	}

	function render_form(errors) {
		return res.render('user_add', {
			errors: errors,
			user: req.user,
			user_obj: b
		});
	}

	var user_obj = models.User.build(b);
	validationResult = user_obj
		.validate()
		.done(function(err, errors_){
			console.log(err, errors_);
			if (typeof(errors_) === 'undefined'){
				console.log(b.password, user_obj.digest, user_obj.salt);
				if (extra_errors.length > 0) {
					return render_form(extra_errors);
				}
				user_obj.setPassword(b.password);
				user_obj.save().then(function(){
					return res.redirect('/admin/user');
				});
			} else {
				var errors = errors_.errors;
				if (extra_errors.length > 0) {
					errors = errors.concat(extra_errors);
				}
				return render_form(errors);
			};
		});
});

router.get('/user/:user_id/edit', ensureAuthenticated, function(req, res) {
	if (req.user.rights !== 'admin') {
		return res.redirect('/admin');
	}
	res.render('user_edit', {
		user: req.user,
		user_obj: req.user_obj
	});
});

router.post('/user/:user_id/edit', ensureAuthenticated, function(req, res) {
	if (req.user.rights !== 'admin') {
		return res.redirect('/admin');
	}
	var b = req.body,
		u = req.user_obj;

	u.set({
		email: b.email,
		rights: b.rights
	});
	if ((b.password !== '')&&(typeof(b.password) !== 'undefined')){
		u.setPassword(b.password);
		console.log('password changed');
	}
	u.save().then(function() {
		// FIXME "success" toast message
		res.redirect('/admin/user');
	}).catch(function(errors) {
		console.log(errors);
		res.render('user_edit', {
			errors: errors.errors,
			user: req.user,
			user_obj: u
		});
	});
});

router.get('/user/:user_id/delete', ensureAuthenticated, function(req, res) {
	if (req.user.rights !== 'admin') {
		return res.redirect('/admin');
	}
	res.render('user_delete', {
		user: req.user,
		user_obj: req.user_obj
	});
});

router.post('/user/:user_id/delete', ensureAuthenticated, function(req, res) {
	if (req.user.rights !== 'admin') {
		// FIXME "failure" toast message
		return res.redirect('/admin');
	}
	req.user.destroy().then(function(){
		// FIXME "success" toast message
		return res.redirect('/admin');
	});
});

module.exports = router;
