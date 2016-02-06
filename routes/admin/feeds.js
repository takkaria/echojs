var express = require('express');
var router = express.Router();
var models = require('../../models');
var debug = require('debug')('echo:admin');
var ensure = require('../../lib/ensure');

var Promise = require('promise');

var request = require('request');
var discover = require('feed-discover');
var FeedParser = require('feedparser');
var request = require('request');

router.get('/', ensure.editorOrAdmin, function(req, res) {
	models.Feed.findAll({
		order: 'errors DESC, title ASC'
	}).then(function(result) {
		res.render('feeds', {
			user: req.user,
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
	.then(function(feedURL) {
		var feedparser = new FeedParser();

		request(feedURL)
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
		});
	});
}

router.post('/add', ensure.editorOrAdmin, function(req, res) {
	var url = req.body.url;

	getFeedMeta(url)
		.then(function(meta) {
			models.Feed.build({
					feedURL: meta.xmlurl,
					siteURL: meta.link,
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
			user: req.user,
			feed: result
		});
	});
});

router.post('/edit', ensure.editorOrAdmin, function(req, res) {
	var b = req.body;

	models.Feed.findById(b.id).then(function(result) {

		// Update title, site URL, feed URL
		result.title = b.title;
		result.siteURL = b.siteURL;
		result.feedURL = b.feedURL;

		result.save()
			.then(function() {
				req.flash('success', "Edit succeeded.");
				res.redirect('/admin/feeds');
			})
			.catch(function (errors) {
				res.render('feed_edit', {
					user: req.user,
					errors: errors.errors,
					feed: result
				});
			});
	});
});

router.post('/delete', ensure.editorOrAdmin, function(req, res) {
	var b = req.body;

	models.Feed.findById(b.id).then(function(feed) {
		return models.Post.destroy({ where: { feedId: b.id }}).then(function() {
			return feed.destroy();
		}).then(function() {
			req.flash('success', "Feed %s deleted.", feed.title);
			res.redirect('/admin/feeds');
		})
	}).catch(function(errors) {
		req.flash("danger", errors);
		res.redirect("/admin/feeds");
	});
});

module.exports = router;
