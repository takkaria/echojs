var express = require('express');
var router = express.Router();
var models = require('../models');

var ensure = require("../lib/ensure");

router.get('/', ensure.editorOrAdmin, function(req, res) {
	models.Event.findAndCountAll({
		where: [
			{ state: ["submitted", "imported"] }
		],
		include: [ models.Location ],
		limit: req.query.limit,
		offset: req.query.limit * (req.query.page - 1),
		order: "startdt ASC"
	}).then(function(result) {
		res.render('admin', {
			user: req.user,
			events_: result.rows,
			pageCount: Math.floor(result.count / req.query.limit),
			itemCount: result.count
		});
	});
});

router.use('/user', require('./admin/user'));
router.use('/event', require('./admin/event'));
router.use('/locations', require('./admin/location'));
router.use('/feeds', require('./admin/feeds'));

module.exports = router;
