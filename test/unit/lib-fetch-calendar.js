'use strict';

const expect = require('chai').expect;
const fetchCalendar = require('../../lib/fetch-calendar');

const nock = require('nock');
nock.disableNetConnect();

const CALENDAR_URL = 'http://example.net/ical';

describe('fetch-calendar', function() {
	it('must call the callback', function(done) {
		fetchCalendar(null, done);
	})

	it('must make an HTTP request', function(done) {
		let serverRequest = nock('http://example.net')
			.get('/ical')
			.replyWithFile(200, __dirname + '/calendar-data/cal001.ics');

		fetchCalendar(CALENDAR_URL, function() {
			expect(serverRequest.isDone()).to.equal(true);
			done();
		})
	})
})
