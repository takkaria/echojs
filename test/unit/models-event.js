var chai = require('chai');
var expect = chai.expect;
chai.use(require('chai-as-promised'));

var Event = require('models').Event;
var moment = require('moment');

describe('Event', function() {
	describe('.isMultiDay', function() {

		it('should correctly identify single-day events', function() {
			var e = Event.build({
				startdt: '2015-07-09T11:00',
				enddt:   '2015-07-09T19:00'
			});

			expect(e.isMultiDay()).to.equal(false);
		});

		it('should correctly identify multi-day events', function() {
			var e = Event.build({
				startdt: '2015-07-09T11:00',
				enddt:   '2015-07-13T19:00'
			});

			expect(e.isMultiDay()).to.equal(true);
		});

		it('should assume no end date means single date', function() {
			var e = Event.build({
				startdt: '2015-07-09T11:00',
			});

			expect(e.isMultiDay()).to.equal(false);
		});
	});

	describe('.saveAndGenerateSlug', function() {

		it('should generate a slug', function() {
			var data = {
				title: 'TEST',
				startdt: new Date(),
				enddt: new Date(),
				blurb: 'Testing'
			};

			var evt = Event.build(data);
			expect(evt).to.not.equal(undefined);

			return evt.saveAndGenerateSlug().then(function(evt_) {
				expect(evt_.id).to.not.equal(null);
				expect(evt_.slug).to.contain('' + evt_.id);
			});
		});

		after(function() {
			// Clean up all TEST rows
			return Event.destroy({ where: { title: 'TEST' } });
		});
	});

	describe('::groupByDays', function() {

		var originalMax;
		var originalFindAll;
		var originalGetCurrentTime;

		var testData = {
			events: [],
			eventMax: 0,
			currentTime: undefined
		};

		before(function() {
			originalMax = Event.max;
			originalFindAll = Event.findAll;
			originalGetCurrentTime = Event._getCurrentTime;

			Event.findAll = () => Promise.resolve(testData.events);
			Event.max = () => Promise.resolve(testData.eventMax);
			Event._getCurrentTime = () => moment(testData.currentTime);
		});

		after(function() {
			Event.max = originalMax;
			Event.findAll = originalFindAll;
			Event._getCurrentTime = originalGetCurrentTime;
		});

		it('should mock up OK', function() {
			expect(Event.max('enddt')).to.eventually.equal(testData.eventMax);
			expect(Event.findAll()).to.eventually.equal(testData.events);
		});

		it('should return an empty object when there are no upcoming events', function() {
			testData.eventMax = null;
			testData.events = [];

			return Event.groupByDays().then((result) => {
				expect(result).to.deep.equal({});
			});
		});

		it('should not crash for multiday events on a different calendar date but less 24 hours in the past', function() {
			testData.currentTime = '2015-06-13T11:00:00.000+0100';
			testData.eventMax = '2015-06-14T23:00:00.000+0100';
			testData.events = [
				Event.build({
					title: 'Test data 1',
					startdt: '2015-06-12T13:00:00.000+0100',
					enddt: '2015-06-14T23:00:00.000+0100',
					allday: null
				})
			];

			return Event.groupByDays();
		});

		it('should not crash when the start time of the latest event in the database is before the current time (but not date)', function() {
			testData.currentTime = '2015-11-19T19:31:48.780Z';
			testData.eventMax = '2015-12-03T19:30:00.000Z';
			testData.events = [
				Event.build({
					title: 'Last event',
					startdt: '2015-12-03T19:30:00.000Z',
					allday: null
				})
			];

			return Event.groupByDays();
		});

	});
});
