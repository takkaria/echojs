var express = require('express');
var router = express.Router();

router.param('id', function(req, res, next, id) {
	var models = req.app.get('models');

	models.Event.find({
		where: { id: id }
	}).then(function(event) {
		if (!event)
			return next(new Error("No such event"));

		req.event = event;
	}).then(next, function (err) {
		next(err);
	});
})

/* GET event add */
router.get('/add', function(req, res) {
	res.render('event_add', { event: req.event });
});

/* GET home page. */
router.get('/:id', function(req, res) {
	res.render('event_page', { event: req.event });
});

module.exports = router;
