var express = require('express'),
	moment = require('moment'),
	router = express.Router();

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

/* POST event add */
router.post('/add', function(req, res) {
	var b = req.body,
		models = req.app.get('models'),
		event_ = {
			title: b.title,
			startdt: moment.unix(b.startdt),
			enddt: moment.unix(b.enddt),
			blurb: b.blurb,
			location: b.location,  // FIXME
			host: b.host,
			type: '',
			cost: b.cost,
			email: b.email,
		};
		console.log(event_);
	models.Event
		.create(event_)
		.then(function(event_) {
			console.log('ok');
			console.log(event_);
			res.redirect(event_.id);
		})
		.catch(function(errors) {
			console.log(errors);
			console.log(req.body);
			res.render('event_add', {
				event_: event_,
				errors: errors.errors
			});
		});
});

/* GET home page. */
router.get('/:id', function(req, res) {
	res.render('event_page', { event: req.event });
});

module.exports = router;
