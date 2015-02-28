var express = require('express');
var router = express.Router();
var moment = require('moment');
var models = require('../models');

// Get rid of the times from moment.calendar() strings as we only want dates
// See: http://momentjs.com/docs/#/customization/calendar/
moment.locale('en', {
	calendar : {
		lastWeek : '[last] dddd',
		lastDay : '[Yesterday]',
		sameDay : '[Today], h:mma',
		nextDay : '[Tomorrow], h:mma',
		nextWeek : 'dddd, h:mma',
		sameElse : 'dddd, Do MMMM h:mma'
	}
});

/* GET home page. */
router.get('/', function(req, res) {
	models.Event.findAll({
		include: [ models.Location ],
		where: [
			{ state: "approved" },
			"(startdt >= date('now', 'start of day') OR date('now') <= enddt)"
		],
		limit: 10,
		order: "startdt ASC"
	}).then(function(events) {
		models.Post.findAll({
			include: [ models.Feed ],
			where: "hidden IS NOT 1 AND date >= date('now', '-3 months') AND ( " +
				"SELECT COUNT(p2.feed_id) FROM post_info AS p2 " +
				"WHERE p2.feed_id = post.feed_id AND p2.date > post.date) == 0",
			order: "date DESC"
		}).then(function(posts) {
			res.render('index', {
				events: events,
				posts: posts,
				user: req.user
			});
		});
	});
});

module.exports = router;
