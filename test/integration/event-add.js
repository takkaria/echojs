'use strict';

var chai = require('chai');
var Browser = require('zombie');
var moment = require('moment');

var expect = chai.expect;
chai.use(require('chai-as-promised'));

const baseUrl = 'http://localhost:' + process.env.PORT;
var browser = new Browser({
	site: baseUrl
});

describe('Given I visit /event/add', function() {
	before(function(done) {
		browser.visit('/event/add', done);
	})

	it('the page should load fine', function() {
		browser.assert.status(200);
	});

	describe('given incomplete form data', function() {
		before(function() {
			browser
				.fill('title', 'testing')
				.fill('location_text', 'testing');
			browser.querySelector('form').submit();
			return browser.wait();
		});

		it('should return to event add URL', function() {
			browser.assert.url('/event/add');
		});

		it('should preserve the input data', function() {
			browser.assert.attribute('#title', 'value', 'testing');
			browser.assert.attribute('#location_text', 'value', 'testing');
		});
	});

	describe('given invalid form data', function() {
		before(function() {
			browser
				.fill('title', 'testing')
				.fill('startdt', 'testing')
				.fill('location_text', 'testing')
				.fill('host', 'testing')
				.fill('blurb', 'testing')
				.fill('email', 'invalid');
			browser.querySelector('form').submit();
			return browser.wait();
		});

		it('should return to event add URL', function() {
			browser.assert.url('/event/add');
		});

		it('should preserve the input data', function() {
			browser.assert.attribute('#title', 'value', 'testing');
			browser.assert.attribute('#startdt', 'value', 'testing');
			browser.assert.attribute('#location_text', 'value', 'testing');
			browser.assert.attribute('#host', 'value', 'testing');
			browser.assert.attribute('#blurb', 'value', 'testing');
			browser.assert.attribute('#email', 'value', 'invalid');
		});
	});

	describe('given complete & valid form data', function() {
		before(function() {
			browser
				.fill('title', 'testing')
				.fill('startdt', moment().add(1, 'day').format("YYYY/MM/DD HH:mm"))
				.fill('location_text', 'testing')
				.fill('host', 'testing')
				.fill('blurb', 'testing')
				.fill('email', 'test@example.com');
			browser.querySelector('form').submit();
			return browser.wait();
		});

		it('should return to the home page', function() {
			browser.assert.url('/');
		});

		xit('should produce an event with a slug that includes their ID');
	});
});
