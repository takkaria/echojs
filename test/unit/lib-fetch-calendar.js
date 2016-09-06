'use strict';

const expect = require('chai').expect;
const includes = require('array-includes');
const fetchCalendar = require('../../lib/fetch-calendar');

const nock = require('nock');
nock.disableNetConnect();

// Constants
const CALENDAR_URL = 'http://example.net/ical';

// Utility functions
function fakeServer(filename, headers) {
	return nock('http://example.net')
			.get('/ical')
			.replyWithFile(200,
					__dirname + '/calendar-data/' + filename,
					headers);
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
	it('should make an HTTP request', function(done) {
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

		describe('and the server replies with caching headers', function() {

			describe('(etags)', function(done) {
				it('should return caching data', function(done) {
					let serverRequest = fakeServer('cal001.ics', {
						'ETag': '"TESTING"',
					});

					fetchCalendar(CALENDAR_URL, function(err, events, cacheData) {
						expect(serverRequest.isDone()).to.equal(true);
						expect(cacheData).to.deep.equal({
							'etag': '"TESTING"',
						});

						done();
					})
				})

				it('... using that data for the next request should use If-None-Match', function(done) {
					const ETAG_CONTENTS = '"TESTING"';

					let cacheData = { 'etag': ETAG_CONTENTS }
					let expectedRequestHeaders = { 'if-none-match': ETAG_CONTENTS }

					let serverRequest = nock('http://example.net', { reqheaders: expectedRequestHeaders })
							.get('/ical')
							.reply(304, null);

					fetchCalendar(CALENDAR_URL, function(err, events, cacheData, newUrl) {
						if (err) done(err);

						expect(serverRequest.isDone()).to.equal(true);
						expect(events).to.deep.equal([]);

						done();
					}, cacheData);
				})
			})

			describe('(last-modified)', function(done) {
				it('should return caching data', function(done) {
					let serverRequest = fakeServer('cal001.ics', {
						'Last-Modified': 'Sun, 04 Sep 2016 22:49:51 GMT'
					});

					fetchCalendar(CALENDAR_URL, function(err, events, cacheData) {
						expect(serverRequest.isDone()).to.equal(true);
						expect(cacheData).to.deep.equal({
							'last-modified': 'Sun, 04 Sep 2016 22:49:51 GMT'
						});

						done();
					})
				})


				it('... using that data for the next request should use If-Modified-Since', function(done) {
					const MODIFIED_SINCE = 'Sun, 04 Sep 2016 22:49:51 GMT';

					let cacheData = { 'last-modified': MODIFIED_SINCE }
					let expectedRequestHeaders = { 'if-modified-since': MODIFIED_SINCE }

					let serverRequest = nock('http://example.net', { reqheaders: expectedRequestHeaders })
							.get('/ical')
							.reply(304, null);

					fetchCalendar(CALENDAR_URL, function(err, events, cacheData, newUrl) {
						if (err) done(err);

						expect(serverRequest.isDone()).to.equal(true);
						expect(events).to.deep.equal([]);

						done();
					}, cacheData);
				})
			})
		})

		describe('and the server replies with a redirect', function() {
			it('it should return the new URL', function(done) {
				let serverRequestRedirect = nock('http://example.net/')
						.get('/redirect')
						.reply(301, '', { Location: '/ical' });
				let serverRequestReal = fakeServer('cal001.ics');

				fetchCalendar('http://example.net/redirect', function(err, events, cacheData, newUrl) {
					expect(serverRequestRedirect.isDone()).to.equal(true);
					expect(serverRequestReal.isDone()).to.equal(true);
					expect(newUrl).to.equal(CALENDAR_URL);

					done();
				})
			})
		})
	})
})
