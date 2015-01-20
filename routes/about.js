var express = require('express');
var marked = require('marked');
var router = express.Router();

router.get('/', function(req, res) {
	res.render('about', {
		user: req.user
	});
});

module.exports = router;
