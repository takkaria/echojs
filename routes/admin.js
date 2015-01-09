var express = require('express'),
	moment = require('moment'),
	router = express.Router();

/* GET event add */
router.get('/', function(req, res) {
	if(!req.isAuthenticated()) {
		return res.redirect('/user/login?next=' + encodeURIComponent('/admin'));
	}

	var models = req.app.get('models'),
		sequelize = models.sequelize;

	models.Event.findAll({
		where: [
			{ state: "submitted" }
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

module.exports = router;
