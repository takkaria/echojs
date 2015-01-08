var express = require('express'),
	moment = require('moment'),
	router = express.Router();

/* GET event add */
router.get('/', function(req, res) {
	if(!req.isAuthenticated()) {
		return res.redirect('/user/login');
	}
	res.render('admin', { 
		user: req.user
	});
});

module.exports = router;
