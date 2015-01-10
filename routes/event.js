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

router.param('slug', function(req, res, next, slug) {
	var models = req.app.get('models');

	models.Event.find({
		where: { slug: slug }
	}).then(function(event_) {
		if (!event_)
			return next(new Error("No such event_"));
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
			state: (req.isAuthenticated()&&((req.user.rights === 'editor')||(req.user.rights === 'admin')))
				?  'approved'
				: 'submitted'
		};
	models.Event
		.create(event_)
		.then(function(e) {
			e.generateSlug();
			e.save().then(function(e_){
				// FIXME add "success" toast
				return res.redirect(
					(e_.state === 'approved')
						? e_.absolute_url
						: '/events'
				);
			});
		})
		.catch(function(errors) {
			console.log(errors, event_, b);
			res.render('event_add', {
				event_: b,
				errors: errors.errors,
				user: req.user
			});
		});
});

/* GET event by ID */
router.get('/:id', function(req, res) {
	console.log(req.event_.absolute_url);
	res.redirect(req.event_.absolute_url);
});

/* GET event by slug */
router.get('/:year/:month/:slug', function(req, res) {
	res.render('event_page', {
		event_: req.event_,
		user: req.user
	});
});

module.exports = router;
