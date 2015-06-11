var expect = require("chai").expect;
var Event = require("../models").Event;
var moment = require("moment");

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
});
