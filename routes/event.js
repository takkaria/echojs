var express = require('express'),
	moment = require('moment'),
	router = express.Router();

router.param('id', function(req, res, next, id) {
	var models = req.app.get('models');

	models.Event.find({
		where: { id: id }
	}).then(function(event_) {
		if (!event_)
			return next(new Error("No such event"));

		req.event_ = event_;
	}).then(next, function (err) {
		next(err);
	});
})

/* GET event add */
router.get('/add', function(req, res) {
	res.render('event_add', { 
		event_: req.event_,
		user: req.user
	});
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
	models.Event
		.create(event_)
		.then(function(event_) {
			res.redirect(event_.id);
		})
		.catch(function(errors) {
			res.render('event_add', {
				event_: event_,
				errors: errors.errors,
				user: user
			});
		});
});

/* GET event page. */
router.get('/:id', function(req, res) {
	res.render('event_page', {
		event_: req.event_,
		user: req.user
	});
});

module.exports = router;
