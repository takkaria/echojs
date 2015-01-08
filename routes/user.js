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
	res.render('login');
});

router.post('/login',
  passport.authenticate('local', { successRedirect: '/',
                                   failureRedirect: '/user/login' })
);

router.get('/logout', function(req, res){
	req.logout();
	res.redirect('/');
});

module.exports = router;
