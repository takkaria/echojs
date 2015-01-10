var express = require('express'),
	moment = require('moment'),
	mailer = require('../lib/mailer'),
	router = express.Router();

router.param('id', function(req, res, next, id) {
	var models = req.app.get('models'),
		where = {id: id};

	models.Event.find({
		where: {
			id: id,
			state: 'approved'
		}
	}).then(function(event_) {
		req.event_ = event_;
		next(!event_ ? new Error("No such event") : null);
	});
})

router.param('slug', function(req, res, next, slug) {
	var models = req.app.get('models');

	models.Event.find({
		where: { slug: slug }
	}).then(function(event_) {
		req.event_ = event_;
		next(!event_ ? new Error("No such event") : null);
	});
})

/* GET event add */
router.get('/add', function(req, res) {
	res.render('event_add', {
		user: req.user
	});
});

/* POST event add */
router.post('/add', function(req, res) {
	var b = req.body,
		models = req.app.get('models');

	b.startdt = moment(b.startdt, 'YYYY/MM/DD hh:mm')
	// strict mode to prevent blank enddt being taken as "now"
	b.enddt = moment(b.enddt, 'YYYY/MM/DD hh:mm', true)
	if(!b.enddt.isValid()) {
		b.enddt = null;
	}

	var	event_ = {
		title: b.title,
		startdt: b.startdt,
		enddt: b.enddt,
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
				// FIXME should show a different message if it's approved already
				req.flash('success', 'Event successfully added; you\'ll get an e-mail when a moderator has looked at it');
				mailer.sendMail({
					template: 'event_submit.html',
					subject: 'Event submitted',
					to: event_.email,
					context: {
						event_: event_
					}
				});
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
				event_: event_,
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
