var express = require('express'),
	moment = require('moment'),
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
			console.log(req.body.next);
			if (req.body.next) {
				return res.redirect(req.body.next);
			}
			return res.redirect('/');
		});
	})(req, res, next);
});

router.get('/password', ensureAuthenticated, function(req, res) {
	res.render('user_password', {user: req.user});
});

router.post('/password', ensureAuthenticated, function(req, res, next) {
	passport.authenticate('local', function(err, user, info) {
		if (err) { return next(err); }
		if (!user) { return res.render('user_password', {
			user: req.user,
			errors: [{
				path: 'password',
				message: 'Your current password doesn\'t seem to be correct; try again?'
			}]
		}); }
		if(req.body.new_password === ''){
			return res.render('user_password', {
				user: req.user,
				errors: [{
					path: 'new_password',
					message: 'New password can\'t be blank'
				}]
			});
		}
		if(req.body.new_password !== req.body.new_password2){
			return res.render('user_password', {
				user: req.user,
				errors: [{
					path: 'new_password2',
					message: 'New passwords don\'t match'
				}]
			});
		}
		req.user.setPassword(req.body.new_password);
		req.user.save().then(function(u_){
			req.flash('success', 'Password changed')
			return res.redirect('/');
		});
	})(req, res, next);
});

router.get('/logout', ensureAuthenticated, function(req, res){
	req.logout();
	res.redirect('/');
});

module.exports = router;
