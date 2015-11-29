var rewire = require('rewire');

var chai = require('chai');
var expect = chai.expect;
chai.use(require('chai-as-promised'));

var api = rewire('../routes/api.js');
var Event = require('../models').Event;

describe('routes/api.js', function() {

	describe('#generateCalendar', function() {
		var generateCalendar = api.__get__('generateCalendar')

		it('should return a promise', function(done) {
			generateCalendar([]).then(function() {
				done();
			})
		});

		it('should generate a calendar when given events', function(done) {
			events = [
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

			generateCalendar(events).then(function(calendar) {
				expect(calendar.toString()).to.contain('BEGIN:VCALENDAR');
				done();
			});
		});

		it('should throw when when given an event without a title', function() {
			events = [
				Event.build({
					startdt: '2015-06-12T13:00:00.000+0100',
					enddt: '2015-06-14T23:00:00.000+0100',
					allday: null
				})
			];

			expect(generateCalendar(events)).to.eventually.throw();
		});

	});
});
