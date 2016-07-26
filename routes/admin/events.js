'use strict';

const express = require('express');
const models = require('../../models');
const ensure = require('../../lib/ensure');

const router = express.Router();

router.get('/', ensure.editorOrAdmin, function(req, res) {
	models.Event.findAndCountAll({
		where: [
			{ state: [ 'submitted', 'imported' ] }
		],
		include: [ models.Location ],
		limit: req.query.limit,
		offset: req.query.limit * (req.query.page - 1),
		order: 'startdt ASC'
	}).then(function(result) {
		res.render('admin_events', {
			user: req.user,
			events_: result.rows,
			pageCount: Math.floor(result.count / req.query.limit),
			itemCount: result.count
		});
	});
});

module.exports = router;
