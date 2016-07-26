var express = require('express');
var router = express.Router();
var models = require('../../models');
var debug = require('debug')('echo:admin');
var ensure = require("../../lib/ensure");

router.param('location_id', function(req, res, next, loc_id) {
	models.Location.find({
		where: { id: loc_id }
	}).then(function(loc) {
		req.loc = loc;
		next(!loc ? new Error("No such location") : null);
	});
});

router.get('/', ensure.editorOrAdmin, function(req, res) {
	models.Location.findAll({
		limit: 20,
	}).then(function(locations) {
		res.render('locations', {
			user: req.user,
			locations: locations
		});
	});
});

router.get('/add', ensure.editorOrAdmin, function(req, res) {
	res.render('location_add', {
		user: req.user,
	});
});

/* POST event add */
router.post('/add', ensure.editorOrAdmin, function(req, res) {
	var b = req.body,
		location = {
			name: b.name,
			address: b.address,
			description: b.description,
			longitude: b.longitude,
			latitude: b.latitude
		};

	models.Location
		.create(location)
		.then(function(location) {
			req.flash('success', 'Location %s created',
					location.name);

			res.redirect("/admin/locations");
		})
		.catch(function(errors) {
			res.render('location_add', {
				loc: location,
				errors: errors.errors,
				user: req.user
			});
		});
});

router.get('/:location_id', ensure.editorOrAdmin, function(req, res) {
	res.render('location', {
		user: req.user,
		loc: req.loc,
	});
});

router.get('/:location_id/edit', ensure.editorOrAdmin, function(req, res) {
	res.render('location_edit', {
		user: req.user,
		loc: req.loc
	});
});

router.post('/:location_id/edit', ensure.editorOrAdmin, function(req, res) {
	var b = req.body,
		location = req.loc;

	location
		.set({
			name: b.name,
			address: b.address,
			description: b.description,
			longitude: b.longitude,
			latitude: b.latitude
		})
		.save()
		.then(function(loc) {
			req.flash('success', 'Location <a href="/admin/locations/%s">%s</a> edited',
					loc.id, loc.name);
			res.redirect('/admin/locations/' + loc.id);
		})
		.catch(function(errors) {
			debug(errors);
			res.render('location_edit', {
				errors: errors.errors,
				user: req.user,
				loc: location
			});
		});
});

router.get('/:location_id/delete', ensure.editorOrAdmin, function(req, res) {
	var location = req.loc;

	res.render('location_delete', {
		user: req.user,
		loc: location
	});
});

router.post('/:location_id/delete', ensure.editorOrAdmin, function(req, res) {
	var location = req.loc;

	location
		.destroy()
		.then(function () {
			req.flash('warning', 'Location %s deleted',
					location.name);
			res.redirect('/admin/locations');
		});
});

module.exports = router;
