var express = require('express');
var router = express.Router();
var models = require('../../models');
var debug = require('debug')('echo:admin');
var mailer = require('../../lib/mailer');
var ensure = require("../../lib/ensure");

router.param('user_id', function(req, res, next, user_id) {
	models.User.find({
		where: { id: user_id }
	}).then(function(user) {
		req.user_obj = user;
		next(!user ? new Error("No such user") : null);
	});
});

router.get('/', ensure.admin, function(req, res) {
	models.User.findAll({
		limit: 20,
	}).then(function(users) {
		res.render('users', {
			user: req.user,
			users: users
		});
	});
});

router.get('/add', ensure.admin, function(req, res) {
	res.render('user_add', {
		user: req.user
	});
});

router.post('/add', ensure.admin, function(req, res) {
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

router.get('/:user_id/edit', ensure.admin, function(req, res) {
	res.render('user_edit', {
		user: req.user,
		user_obj: req.user_obj
	});
});

router.post('/:user_id/edit', ensure.admin, function(req, res) {
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

router.get('/:user_id/delete', ensure.admin, function(req, res) {
	res.render('user_delete', {
		user: req.user,
		user_obj: req.user_obj
	});
});

router.post('/:user_id/delete', ensure.admin, function(req, res) {
	req.user_obj.destroy().then(function(){
		req.flash('warning', 'User deleted');
		return res.redirect('/admin');
	});
});

module.exports = router;
