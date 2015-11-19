var expect = require("chai").expect;
var Event = require("../models").Event;
var moment = require("moment");

var utils = require("./_utils");

describe("Event", function() {
	describe(".isMultiDay", function() {

		it("should correctly identify single-day events", function() {
			var e = Event.build({
				startdt: "2015-07-09T11:00",
				enddt:   "2015-07-09T19:00"
			});

			expect(e.isMultiDay()).to.equal(false);
		});

		it("should correctly identify multi-day events", function() {
			var e = Event.build({
				startdt: "2015-07-09T11:00",
				enddt:   "2015-07-13T19:00"
			});

			expect(e.isMultiDay()).to.equal(true);
		});

		it("should assume no end date means single date", function() {
			var e = Event.build({
				startdt: "2015-07-09T11:00",
			});

			expect(e.isMultiDay()).to.equal(false);
		});
	});

	describe("::groupByDays", function() {

		var originalMax,
		    originalFindAll,
		    originalGetCurrentTime;

		var testData = {
			events: [],
			eventMax: 0,
			currentTime: undefined
		};

		before(function() {
			originalMax = Event.max;
			originalFindAll = Event.findAll;
			originalGetCurrentTime = Event._getCurrentTime;

			Event.findAll         = utils.mockPromise(function() { return testData.events; });
			Event.max             = utils.mockPromise(function() { return testData.eventMax; });
			Event._getCurrentTime = function() { return moment(testData.currentTime); };
		});

		after(function() {
			Event.max = originalMax;
			Event.findAll = originalFindAll;
			Event._getCurrentTime = originalGetCurrentTime;
		});

		it("should mock up OK", function(done) {
			Event.max('enddt').then(function(max) {
				expect(max).to.equal(testData.eventMax);

				Event.findAll().then(function(events) {
					expect(events).to.equal(testData.events);
					done();
				});
			});
		});

		it("should not crash for multiday events on a different calendar date but less 24 hours in the past", function(done) {

			testData.currentTime = "2015-06-13T11:00:00.000+0100";
			testData.eventMax = "2015-06-14T23:00:00.000+0100";
			testData.events = [
				Event.build({
					title: 'Test data 1',
					startdt: "2015-06-12T13:00:00.000+0100",
					enddt: "2015-06-14T23:00:00.000+0100",
					allday: null
				})
			];

			Event.groupByDays().then(function(list) {
				expect(list).to.not.equal(null);
				done();
			}).catch(function (err) {
				done(err);
			});
		});

		it("should not crash when the start time of the latest event in the database is before the current time (but not date)", function(done) {

			testData.currentTime = '2015-11-19T19:31:48.780Z';
			testData.eventMax = '2015-12-03T19:30:00.000Z';
			testData.events = [
				Event.build({
					title: 'Last event',
					startdt: "2015-12-03T19:30:00.000Z",
					allday: null
				})
			];

			Event.groupByDays().then(function(list) {
				done();
			}).catch(function (err) {
				done(err);
			});
		});

	});
});
