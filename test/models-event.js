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

		var realMax;
		var realFindAll;

		var testEvents = [
			Event.build(),
			Event.build()
		];
		var testEventMax = "end";

		before(function() {
			realMax = Event.max;
			realFindAll = Event.findAll;

			Event.findAll = utils.mockPromise(testEvents);
			Event.max = utils.mockPromise(testEventMax);
		});

		after(function() {
			Event.max = realMax;
			Event.findAll = realFindAll;
		});

		it("should mock up OK", function(done) {

			Event.max('enddt').then(function(max) {
				expect(max).to.equal(testEventMax);

				Event.findAll().then(function(events) {
					expect(events).to.equal(testEvents);
					done();
				});
			});

		});

	});
});
