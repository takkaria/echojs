var express = require('express');
var router = express.Router();
var models = require('../models');
var Promise = require('promise');

/* GET home page. */
router.get('/', function(req, res, next) {

	Promise.all([
		models.Event.groupByDays({
			include: [ models.Location ],
			where: [
				{ state: "approved" },
				["(startdt >= date('now', 'start of day') OR date('now') <= enddt)", []]
			],
			order: "startdt ASC",
			limit: 10
		}),

		models.Post.findAll({
			include: [ models.Feed ],
			where: ["hidden IS NOT 1 AND date >= date('now', '-3 months') AND ( " +
				"SELECT COUNT(p2.feed_id) FROM post_info AS p2 " +
				"WHERE p2.feed_id = post.feed_id AND p2.date > post.date) == 0", []],
			order: "date DESC"
		})
	]).then(function (results) {
		var events = results[0];
		var posts = results[1];

		res.render('index', {
			events: events,
			posts: posts,
			user: req.user
		});
	});
});

module.exports = router;
