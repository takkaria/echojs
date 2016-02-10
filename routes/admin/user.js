'use strict';

var express = require('express');
var router = express.Router();
var models = require('../../models');
var debug = require('debug')('echo:admin');
var notify = require('../../lib/notify');
var ensure = require('../../lib/ensure');
var Promise = require('promise');

router.param('user_id', function(req, res, next, user_id) {
	models.User.find({
		where: { id: user_id }
	}).then(function(user) {
		if (user) {
			req.userObj = user;
			next();
		} else {
			res.status(404);
			res.render('404', { thing: 'user' });
		}
	});
});

router.use(ensure.admin);

router.get('/', function(req, res) {
	models.User.findAll({
		limit: 20,
	}).then(function(users) {
		res.render('users', {
			user: req.user,
			users: users
		});
	});
});

router.get('/add', function(req, res) {
	res.render('user_add', {
		user: req.user
	});
});

router.post('/add', function(req, res) {
	var b = req.body;
	var userObj = models.User.build(b);

	userObj
		.validate()
		.then(function(errors_) {
			var errors = typeof(errors_) === 'undefined' ? [] : errors_.errors;

			if (b.password === '' || typeof(b.password) === 'undefined') {
				errors = errors.concat([ {
					path: 'password',
					message: 'You must set a password'
				} ]);
			}

			debug(err, errors);
			debug(b.password, userObj.digest, userObj.salt);

			if (errors.length > 0) {
				return res.render('user_add', {
					errors: errors,
					user: req.user,
					userObj: b
				});
			}

			return userObj.setPassword(b.password);
		}).then(function(user) {
			return user.save();
		}).then(function(user) {
			req.flash('success', 'User <a href="/admin/user/%s/edit">%s</a> added',
								user.id, user.id);
			notify.newUser(user);
			return res.redirect('/admin/user');
		});
});

router.get('/:user_id/edit', function(req, res) {
	res.render('user_edit', {
		user: req.user,
		userObj: req.userObj
	});
});

router.post('/:user_id/edit', function(req, res) {
	var b = req.body,
		u = req.userObj;

	u.set({
		email: b.email,
		notify: (b.notify === 'on') ? 1 : 0,
		rights: b.rights
	});

	debug(u.changed());
	debug(b, u);

	var promise;

	if ((b.password !== '') && (typeof(b.password) !== 'undefined')) {
		promise = u.setPassword(b.password);
		debug('password changed');
	} else {
		promise = new Promise();
	}

	promise.then(function() {
		return u.save();
	}).then(function(u_) {
		req.flash('success', 'User <a href="/admin/user/%s/edit">%s</a> saved',
							u_.id, u_.id);
		res.redirect('/admin/user');
	}).catch(function(errors) {
		debug(errors);
		res.render('user_edit', {
			errors: errors.errors,
			user: req.user,
			userObj: u
		});
	});
});

router.get('/:user_id/delete', function(req, res) {
	res.render('user_delete', {
		user: req.user,
		userObj: req.userObj
	});
});

router.post('/:user_id/delete', function(req, res) {
	req.userObj.destroy().then(function(){
		req.flash('warning', 'User deleted');
		return res.redirect('/admin/user');
	});
});

module.exports = router;
