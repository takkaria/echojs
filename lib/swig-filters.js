'use strict';

var url = require('url');

module.exports = function(swig) {
	// Show just the hostname of an URL, minus the www if present
	swig.setFilter('hostname', function(input) {
		let host = url.parse(input).hostname;
		return typeof host === 'string' ? host.replace(/^www\./, '') : input;
	});
};
