'use strict';

var rewire = require('rewire');

var chai = require('chai');
var expect = chai.expect;
chai.use(require('chai-as-promised'));

var api = rewire('routes/api.js');
var Event = require('models').Event;

describe('routes/api.js', function() {

	describe('JSON output', function() {
		xit('should return valid JSON & correct MIME type');
		xit('should at the highest level be an array');
	});

	describe('ical output', function() {
		xit('should return an icalendar with correct header & MIME type');
	})

	describe('the API generally', function() {
		xit('should not return events starting before specified date');
		xit('should not return events starting after specified date');
		xit('should error when given malformed start date');
		xit('should error when given malformed end date');
	});

	describe('#generateCalendar', function() {
		var generateCalendar = api.__get__('generateCalendar');

		// XXX All these tests are in the wrong place.  They should be
		// run as integration tests.

		it('should generate a calendar when given events', function() {
			const events = [
				Event.build({
					title: 'Last event',
					startdt: '2015-12-03T19:30:00.000Z',
					allday: null
				}),
				Event.build({
					title: 'Test data 1',
					startdt: '2015-06-12T13:00:00.000+0100',
					enddt: '2015-06-14T23:00:00.000+0100',
					allday: null
				})
			];

			let cal = generateCalendar(events);
			expect(cal.toString()).to.contain('BEGIN:VCALENDAR');
		});

	});
});
