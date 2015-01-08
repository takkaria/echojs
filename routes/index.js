var express = require('express');
var router = express.Router();
var moment = require('moment');

/* GET home page. */
router.get('/', function(req, res) {
	var models = req.app.get('models');
	var sequelize = models.sequelize;

	models.Event.findAll({
		where: [
			{ state: "approved" },
			"(startdt >= date('now', 'start of day') OR date('now') <= enddt)"
		],
		limit: 10,
		order: "startdt ASC"
	}).then(function(events) {

		// This will look like
		// [ { date: moment, events: [ models.Event(), models.Event(), ... ] }, ... ]
		var ordered = [];
		var chunk;
		var last;

		// Group events by date
		events.forEach(function(event) {
			var date = event.startdt.format("YYYY-MM-DD");

			// Create a new grouping ('chunk') for a different date
			if (date != last) {
				chunk = {};
				chunk.date = moment(date);
				chunk.longDate = chunk.date.format("dddd, Do MMMM YYYY");
				chunk.events = [];
				if (chunk.date.diff(moment(), 'days') < 7)
					chunk.shortDate = chunk.date.calendar();

				ordered.push(chunk);

				// Remember date for next iteration
				last = date;
			}

			// Add event to current chunk
			chunk.events.push(event);
		});

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
