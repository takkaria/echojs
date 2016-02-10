var express = require('express');
var notify = require('../lib/notify');
var debug = require('debug')('echo:user');
var passport = require('passport');
var router = express.Router();
var models = require('../models');
var ensure = require('../lib/ensure');
var Promise = require('promise');

router.get('/login', function(req, res) {
	res.render('login', { next: req.query.next });
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

router.get('/password/change', ensure.authenticated, function(req, res) {
	res.render('password_change', { user: req.user });
});

router.post('/password/change', ensure.authenticated, function(req, res, next) {
	passport.authenticate('local', function(err, user, info) {
		if (err) { return next(err); }

		if (!user) {
			return res.render('password_change', {
				user: req.user,
				errors: [{
					path: 'password',
					message: 'Your current password doesn\'t seem to be correct; try again?'
				}]
			});
		}

		if (req.body.new_password === '') {
			return res.render('password_change', {
				user: req.user,
				errors: [{
					path: 'new_password',
					message: 'New password can\'t be blank'
				}]
			});
		}

		if (req.body.new_password !== req.body.new_password2) {
			return res.render('password_change', {
				user: req.user,
				errors: [{
					path: 'new_password2',
					message: 'New passwords don\'t match'
				}]
			});
		}

		req.user.setPassword(req.body.new_password).then(function(user) {
			return user.save();
		}).then(function(user) {
			req.flash('success', 'Password changed. You are now logged in.');
			return res.redirect('/');
		});
	})(req, res, next);
});

router.get('/logout', ensure.authenticated, function(req, res) {
	req.logout();
	res.redirect('/');
});

router.get('/password/reset', function(req, res) {
	res.render('password_reset', { user: req.user });
});

router.post('/password/reset', function(req, res, next) {
	models.User
		.findOne({ where: { email: req.body.email } })
		.then(function(user) {
			if (user) {
				user
					.resetPassword()
					.save()
					.then(notify.passwordReset);
			}

			res.redirect('/user/password/reset/done');
		});
});

router.get('/password/reset/done', function(req, res, next) {
	res.render('password_reset_done');
});

router.get('/password/reset/:token', function(req, res, next) {
	models.User.find({ where: { pwreset: req.params.token } }).then(function(user) {
		if (user) {
			res.render('password_reset_change', { user: user });
		} else {
			req.flash('danger', 'Invalid reset link, or maybe it has been used already?');
			res.redirect('/user/password/reset');
		}
	});
});

router.post('/password/reset/:token', function(req, res, next) {
	models.User.find({
		where: { pwreset: req.params.token }
	}).then(function(user) {
		if (req.body.new_password === '') {
			return res.render('password_change', {
				user: user,
				errors: [{
					path: 'new_password',
					message: 'New password can\'t be blank'
				}]
			});
		}

		if (req.body.new_password !== req.body.new_password2) {
			return res.render('password_change', {
				user: user,
				errors: [{
					path: 'new_password2',
					message: 'New passwords don\'t match'
				}]
			});
		}

		user.setPassword(req.body.new_password)
		.then(function(user) {
			user.set('pwreset', null);
			return user.save();
		}).then(function(user) {
			var logIn = Promise.denodeify(req.logIn);
			return logIn(user);
		}).then(function() {
			req.flash('success', 'Password changed');
			return res.redirect('/');
		});
	});
});

module.exports = router;
