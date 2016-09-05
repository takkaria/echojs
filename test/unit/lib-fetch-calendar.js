'use strict';

const expect = require('chai').expect;
const includes = require('array-includes');
const fetchCalendar = require('../../lib/fetch-calendar');

const nock = require('nock');
nock.disableNetConnect();

// Constants
const CALENDAR_URL = 'http://example.net/ical';

// Utility functions
function fakeServer(filename) {
	return nock('http://example.net')
			.get('/ical')
			.replyWithFile(200, __dirname + '/calendar-data/' + filename);
}

const models = require('../../models');
const Event = models.Event;
const EVENT_KEYS = Object.keys(Event.attributes);

function allValidKeys(evt) {
	for (let field of Object.keys(evt)) {
		if (!includes(EVENT_KEYS, field)) {
			console.log('Key invalid: "' + field + '"');
			return false;
		}
	}

	return true;
}

// Tests
describe('fetch-calendar', function() {
	it('must make an HTTP request', function(done) {
		let serverRequest = fakeServer('cal001.ics');

		fetchCalendar(CALENDAR_URL, function() {
			expect(serverRequest.isDone()).to.equal(true);
			done();
		})
	})

	describe('when fetching cal001.ics', function() {
		it('should return an array with one event', function(done) {
			let serverRequest = fakeServer('cal001.ics');

			fetchCalendar(CALENDAR_URL, function(err, events) {
				expect(serverRequest.isDone()).to.equal(true);
				expect(events).to.not.equal(null);
				expect(Array.isArray(events)).to.equal(true);
				expect(events.length).to.equal(1);
				expect(allValidKeys(events[0])).to.equal(true);
				done();
			})
		})
	})
})
