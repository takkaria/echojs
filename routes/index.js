var express = require('express');
var router = express.Router();
var moment = require('moment');

// Get rid of the times from moment.calendar() strings as we only want dates
// See: http://momentjs.com/docs/#/customization/calendar/
moment.locale('en', {
	calendar : {
		lastDay : '[Yesterday]',
		sameDay : '[Today]',
		nextDay : '[Tomorrow]',
		lastWeek : '[last] dddd',
		nextWeek : 'dddd',
		sameElse : 'L'
	}
});

/* GET home page. */
router.get('/', function(req, res) {
	var models = req.app.get('models');
	var sequelize = models.sequelize;

	models.Event.groupByDays({
		where: [
			{ state: "approved" },
			"(startdt >= date('now', 'start of day') OR date('now') <= enddt)"
		],
		limit: 10,
		order: "startdt ASC"
	}, function(ordered){
		models.Post.findAll({
			include: [ models.Feed ],
			where: "hidden IS NOT 1 AND date >= date('now', '-3 months') AND ( " +
				"SELECT COUNT(p2.feed_id) FROM post_info AS p2 " +
				"WHERE p2.feed_id = post.feed_id AND p2.date > post.date) == 0",
			order: "date DESC"
		}).then(function(posts) {
			res.render('index', {
				events: ordered,
				posts: posts,
				user: req.user
			});
		});
	});
});

module.exports = router;
