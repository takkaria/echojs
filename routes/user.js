var express = require('express'),
	moment = require('moment'),
	mailer = require('../lib/mailer'),
	debug = require('debug')('user'),
	passport = require('passport'),
	router = express.Router();

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/user/login?next=' + encodeURIComponent(req.originalUrl))
}

router.param('email', function(req, res, next, id) {
	var models = req.app.get('models');

	models.User.find({
		where: { email: email }
	}).then(function(user) {
		if (!user)
			return next(new Error("No such user"));

		req.user = user;
	}).then(next, function (err) {
		next(err);
	});
})

router.get('/login', function(req, res) {
	res.render('login', {next: req.query.next});
});

router.post('/login', function(req, res, next) {
	passport.authenticate('local', function(err, user, info) {
		if (err) { return next(err); }
		if (!user) { return res.render('login'); }
		req.logIn(user, function(err) {
			if (err) { return next(err); }
			debug(req.body.next);
			if (req.body.next) {
				return res.redirect(req.body.next);
			}
			return res.redirect('/');
		});
	})(req, res, next);
});

router.get('/password/change', ensureAuthenticated, function(req, res) {
	res.render('password_change', {user: req.user});
});

router.post('/password/change', ensureAuthenticated, function(req, res, next) {
	passport.authenticate('local', function(err, user, info) {
		if (err) { return next(err); }
		if (!user) { return res.render('password_change', {
			user: req.user,
			errors: [{
				path: 'password',
				message: 'Your current password doesn\'t seem to be correct; try again?'
			}]
		}); }
		if(req.body.new_password === ''){
			return res.render('password_change', {
				user: req.user,
				errors: [{
					path: 'new_password',
					message: 'New password can\'t be blank'
				}]
			});
		}
		if(req.body.new_password !== req.body.new_password2){
			return res.render('password_change', {
				user: req.user,
				errors: [{
					path: 'new_password2',
					message: 'New passwords don\'t match'
				}]
			});
		}
		req.user.setPassword(req.body.new_password);
		req.user.save().then(function(u_){
			req.flash('success', 'Password changed. You are now logged in.')
			return res.redirect('/');
		});
	})(req, res, next);
});

router.get('/logout', ensureAuthenticated, function(req, res){
	req.logout();
	res.redirect('/');
});

router.get('/password/reset', function(req, res) {
	res.render('password_reset', {user: req.user});
});

router.post('/password/reset', function(req, res, next) {
	var models = req.app.get('models');
	models.User
		.find({ where: { email: req.body.email } })
		.then(function (user) {
			if (user) {
				user.resetPassword();
				user.save().then(mailer.sendPasswordResetMail);
			}

			res.redirect('/user/password/reset/done')
		});
});

router.get('/password/reset/done', function(req, res, next) {
	res.render('password_reset_done');
});

router.get('/password/reset/:token', function(req, res, next) {
	var models = req.app.get('models');
	models.User.find({where: { pwreset: req.params.token}}).then(function(user){
		if (user) {
			res.render('password_reset_change', {user: user});
		} else {
			req.flash('danger', 'Invalid reset link, or maybe it has been used already?');
			res.redirect('/user/password/reset');
		}
	});
});

router.post('/password/reset/:token', function(req, res, next) {
	var models = req.app.get('models');
	models.User.find({
		where: {pwreset: req.params.token,}}).then(function(user){
		if(req.body.new_password === ''){
			return res.render('password_change', {
				user: user,
				errors: [{
					path: 'new_password',
					message: 'New password can\'t be blank'
				}]
			});
		}
		if(req.body.new_password !== req.body.new_password2){
			return res.render('password_change', {
				user: user,
				errors: [{
					path: 'new_password2',
					message: 'New passwords don\'t match'
				}]
			});
		}
		user.setPassword(req.body.new_password);
		user.set('pwreset', null);
		user.save().then(function(u_){
			req.logIn(u_, function(err) {
				req.flash('success', 'Password changed')
				return res.redirect('/');
			});
		});
	});
});


module.exports = router;
