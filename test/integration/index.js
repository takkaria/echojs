'use strict';

var chai = require('chai');
var expect = chai.expect;
chai.use(require('chai-as-promised'));

const baseUrl = 'http://localhost:' + process.env.PORT;

var Browser = require('zombie');
var browser = new Browser({
	site: baseUrl
});

describe('Given I visit /', function() {
	before(function(done) {
		browser.visit('/', done);
	});

	it('the page should load fine', function() {
		browser.assert.status(200);
	});
});
