'use strict';

const chai = require('chai');
const request = require('request');
const moment = require('moment');

const Event = require('../../models').Event;

const expect = chai.expect;
chai.use(require('chai-as-promised'));

let baseUrl = 'http://localhost:' + process.env.PORT;

describe('/api', function() {

	describe('/json', function() {
		let url = baseUrl + '/api/json';

		it('should return valid JSON & correct MIME type', function(done) {
			request(url, function(error, response, body) {
				expect(error).to.equal(null);
				expect(response.statusCode === 200);
				expect(response.headers['content-type']).to.contain('application/json');
				expect(() => JSON.parse(response.body)).to.not.throw();
				done();
			});
		});

		it('should at the highest level be an array', function(done) {
			request(url, function(error, response, body) {
				let resp = JSON.parse(response.body);
				expect(typeof resp === 'array');
				done();
			});
		});
	});

	describe('/ical', function() {
		let url = baseUrl + '/api/ical';

		it('should return an icalendar with correct header & MIME type', function(done) {
			request(url, function(error, response, body) {
				expect(error).to.equal(null);
				expect(response.statusCode === 200);
				expect(response.headers['content-type']).to.contain('text/calendar');
				expect(body).to.contain('BEGIN:VCALENDAR');
				done();
			});
		});

		it('should have event entries', function(done) {
			let data = {
				title: 'A testing event',
				startdt: moment().add(1, 'day').startOf('day'),
				blurb: 'Testing',
				state: 'approved'
			};

			Event.build(data).save().then(function() {
				request(url, function(error, response, body) {
					expect(error).to.equal(null);
					expect(response.statusCode == 200);
					expect(body).to.contain('A testing event');
					done();
				});
			});
		})
	})

	describe('the API generally', function() {
		xit('should not return events starting before specified date');
		xit('should not return events starting after specified date');
		xit('should error when given malformed start date');
		xit('should error when given malformed end date');
	});
});
