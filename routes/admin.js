var express = require('express'),
	moment = require('moment'),
	router = express.Router();

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/user/login?next=' + encodeURIComponent(req.originalUrl))
}

router.param('id', function(req, res, next, id) {
	var models = req.app.get('models');

	models.Event.find({
		where: { id: id }
	}).then(function(event_) {
		if (!event_)
			return next(new Error("No such event"));

		req.event_ = event_;
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

router.get('/event/:id', ensureAuthenticated, function(req, res) {
	res.render('event_page', {
		event_: req.event_,
		user: req.user
	});
});

router.get('/event/:id/approve', ensureAuthenticated, function(req, res) {
	var event_ = req.event_;
	if ((event_.state === 'approved')||(event_.state === 'hidden')) {
		res.redirect('/admin/' + req.event_.id);
	}
	res.render('event_approve', {
		event_: event_,
		user: req.user
	});
});

router.post('/event/:id/approve', ensureAuthenticated, function(req, res) {
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

router.get('/event/:id/reject', ensureAuthenticated, function(req, res) {
	var event_ = req.event_;
	if ((event_.state === 'approved')||(event_.state === 'hidden')) {
		res.redirect('/admin/' + req.event_.id);
	}
	res.render('event_reject', {
		event_: req.event_,
		user: req.user
	});
});

router.post('/event/:id/reject', ensureAuthenticated, function(req, res) {
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
		models = req.app.get('models');
	models.User
		.create(b)
		.then(function(user) {
			user.setPassword(b.password);
			user.save().then(function() {
				console.log(b.password, user.digest, user.salt);
				res.redirect('/admin/user');
			});
		})
		.catch(function(errors) {
			console.log(errors);
			res.render('user_add', {
				new_user: b,
				errors: errors.errors,
				user: req.user
			});
		});
});

module.exports = router;
