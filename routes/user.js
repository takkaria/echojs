var express = require('express'),
	moment = require('moment'),
	passport = require('passport'),
	router = express.Router();

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
		if (!user) { return res.redirect('/user/login'); }
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

router.get('/logout', function(req, res){
	req.logout();
	res.redirect('/');
});

module.exports = router;
