'use strict';

var chai = require('chai');
var Browser = require('zombie');
var moment = require('moment');
var models = require('models');

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

	describe('submitting incomplete form data', function() {
		before(function(done) {
			browser.visit('/event/add');
			browser.wait(function() {
				// Don't provide a title
				browser
					.fill('startdt', 'testing')
					.fill('enddt', 'testing')
					.fill('location_text', 'testing')
					.fill('host', 'testing')
					.fill('blurb', 'testing')
					.fill('email', 'test@example.com');
				browser.querySelector('form').submit();
				browser.wait(done);
			});
		});

		it('should return to event add URL', function() {
			browser.assert.url('/event/add');
		});

		it('should preserve the input data', function() {
			browser.assert.attribute('#startdt', 'value', 'testing');
			browser.assert.attribute('#enddt', 'value', 'testing');
			browser.assert.attribute('#location_text', 'value', 'testing');
			browser.assert.attribute('#host', 'value', 'testing');
			browser.assert.text('#blurb', 'testing');
			browser.assert.attribute('#email', 'value', 'test@example.com');
		});
	});

	describe('submitting no start date', function() {
		it('should show an error', function(done) {
			browser.fill('startdt', '')
			browser.querySelector('form').submit();
			browser.wait(function() {
				browser.assert.text('.text-danger', /date/i);
				done();
			});
		});
	})

	describe('submitting no location', function() {
		it('should show an error', function(done) {
			browser.fill('location_text', '')
			browser.querySelector('form').submit();
			browser.wait(function() {
				browser.assert.text('.text-danger', /location/i);
				done();
			});
		});
	});

	describe('submitting an invalid URL', function() {
		it('should show an error', function(done) {
			browser.fill('url', '<script>this is not valid</strong>££$!£$^**')
			browser.querySelector('form').submit();
			browser.wait(function() {
				browser.assert.text('.text-danger', /URL/i);
				done();
			});
		});
	});

	describe('submitting an invalid email address', function() {
		it('should show an error', function(done) {
			browser.fill('email', 'invalid')
			browser.querySelector('form').submit();
			browser.wait(function() {
				browser.assert.text('.text-danger', /email/i);
				done();
			});
		});
	});

	describe('submitting complete & valid event data', function() {
		before(function(done) {
			browser
				.fill('title', 'testing')
				.fill('startdt', moment().add(1, 'day').format("YYYY/MM/DD HH:mm"))
				.fill('location_text', 'testing')
				.fill('host', 'testing')
				.fill('blurb', 'testing')
				.fill('url', 'http://www.legit.com/')
				.fill('email', 'test@example.com');
			browser.querySelector('form').submit();
			browser.wait(done);
		});

		it('should return to the home page, noting success', function() {
			browser.assert.url('/');
			browser.assert.text('.alert', /event submitted/i)
		});

		it('should produce an event with a slug that includes its ID', function(done) {
			models.Event.findOne({
				where: {
					title: 'testing'
				},
				order: 'id DESC'
			}).then(function(evt) {
				expect(evt.slug).to.contain(evt.id);
				done();
			});
		});
	});
});
