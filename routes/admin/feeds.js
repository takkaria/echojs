var express = require('express');
var router = express.Router();
var models = require('../../models');
var debug = require('debug')('echo:admin');
var mailer = require('../../lib/mailer');
var ensure = require('../../lib/ensure');

var Promise = require('promise');

var request = require('request');
var discover = require('feed-discover');
var FeedParser = require('feedparser');
var request = require('request');

router.get('/', ensure.editorOrAdmin, function(req, res) {
	models.Feed.findAll().then(function(result) {
		res.render('feeds', {
			feeds: result
		});
	});
});

function getFeedMeta(url) {
	return new Promise(function(resolve, reject) {
		request(url)
			.on('error', function(err) {
				reject(err);
			})
			.on('end', function() {
				reject(new Error("No feed found."));
			})
			.pipe(discover(url))
			.on('data', function(feed) {
				resolve(feed.toString());
			});
	})
	.then(function(feed_url) {
		var feedparser = new FeedParser();

		request(feed_url)
			.on('response', function (res) {
				if (res.statusCode != 200)
					throw new Error('Bad status code: ' + res.statusCode);
				this.pipe(feedparser);
			});

		return new Promise(function(resolve, reject) {
			feedparser
				.on('meta', function(meta) {
					resolve(meta);
				})
				.on('end', function() {
					reject(new Error('No metadata found.'));
				});
		})
	});
}

router.post('/add', ensure.editorOrAdmin, function(req, res) {
	var url = req.body.url;

	getFeedMeta(url)
		.then(function(meta) {
			models.Feed.build({
					id: meta.xmlurl,
					site_url: meta.link,
					title: meta.title,
				})
				.save()
				.then(function () {
					req.flash("success", "Feed '%s' created", meta.title);
					res.redirect("/admin/feeds");
				});
		})
		.catch(function(err) {
			debug(err);
			req.flash("warning", err.message);
			res.redirect("/admin/feeds");
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
