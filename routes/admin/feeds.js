var express = require('express');
var router = express.Router();
var models = require('../../models');
var debug = require('debug')('echo:admin');
var mailer = require('../../lib/mailer');
var ensure = require("../../lib/ensure");

router.get('/', ensure.editorOrAdmin, function(req, res) {
	models.Feed.findAll().then(function(result) {
		res.render('feeds', {
			feeds: result
		});
	});
});

router.get('/edit', ensure.editorOrAdmin, function(req, res) {
	var q = req.query;

	models.Feed.findById(q.id).then(function(result) {
		res.render('feed_edit', {
			feed: result
		});
	});
});

router.post('/edit', ensure.editorOrAdmin, function(req, res) {
	var b = req.body;

	models.Feed.findById(b.id).then(function(result) {

		// Update title, site URL, feed URL
		result.title = b.title;
		result.site_url = b.site_url;
		result.id = b.feed_url;

		result.save()
			.then(function() {
				req.flash('success', "Edit succeeded.");
				res.redirect('/admin/feeds');
			})
			.catch(function (errors) {
				res.render('feed_edit', {
					errors: errors.errors,
					feed: result
				});
			});
	});
});

router.post('/delete', ensure.editorOrAdmin, function(req, res) {
	var b = req.body;

	function onerror(errors) {
		req.flash("danger", errors);
		res.redirect("/admin/feeds");
	}

	models.Feed.findById(b.id).then(function(feed) {
		models.Post.destroy({ where: { feed_id: b.id }}).then(function() {

			feed.destroy()
				.then(function() {
					req.flash('success', "Feed %s deleted.", result.title);
					res.redirect('/admin/feeds');
				}).catch(onerror);

		}).catch(onerror);
	});
});

module.exports = router;
