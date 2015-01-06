var express = require('express');
var router = express.Router();

/* GET events */
router.get('/*', function(req, res) {
	res.render('events', { event: req.event });
});

module.exports = router;
