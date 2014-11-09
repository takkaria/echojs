var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
	var Event = req.app.get('models').Event;

	Event.findAll().success(function(events) {
		res.render('index', { events: events });
	});
});

module.exports = router;
