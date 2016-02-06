'use strict';

var chai = require('chai');
var request = require('request');

var expect = chai.expect;
chai.use(require('chai-as-promised'));

let baseUrl = 'http://localhost:' + process.env.PORT;

describe('/api', function() {

	describe('/json', function() {
		let url = baseUrl + '/api/json';

		xit('should return valid JSON & correct MIME type');
		xit('should at the highest level be an array');
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
	})

	describe('the API generally', function() {
		xit('should not return events starting before specified date');
		xit('should not return events starting after specified date');
		xit('should error when given malformed start date');
		xit('should error when given malformed end date');
	});
});
