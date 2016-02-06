'use strict';

var chai = require('chai');
var expect = chai.expect;
chai.use(require('chai-as-promised'));

var Browser = require('zombie');
var browser = new Browser({
	site: 'http://localhost:' + process.env.PORT
});

describe('Given I visit /event/add', function() {
	before(function(done) {
		browser.visit('/event/add', done);
	})

	it("the page should load fine", function() {
		browser.statusCode.should.equal(200);
	});

	xit('submitted events should have a slug including their id')
});
