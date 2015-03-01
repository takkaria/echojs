var expect = require("chai").expect;
var fetch = require("../fetch");

// Hideous monkey patching
Date.prototype.toShortISOString = function() {
	function pad(number) {
		if (number < 10)
			return '0' + number;
		else
			return number;
	}
	
	return this.getUTCFullYear() +
		'-' + pad( this.getUTCMonth() + 1 ) +
		'-' + pad( this.getUTCDate() ) +
		'T' + pad( this.getUTCHours() ) +
		':' + pad( this.getUTCMinutes() );
};

describe("fetch", function() {
	describe("#findDate", function() {
		it("should ignore dates in the past", function() {
			var result = fetch.findDate(
				new Date("2013-01-19T04:00"),
				"30 December, 4pm"
			);
			expect(result).to.equal(null);
		});

		it("should parse a date and time with st/nd/rd/th", function() {
			var result = fetch.findDate(
				new Date("2013-01-19T04:00"),
				"4pm on January 30th"
			);
			expect(result.toShortISOString()).to.equal("2013-01-30T16:00");
		});

		it("should find a date embedded in HTML", function() {
			var result = fetch.findDate(
				new Date("2014-10-20T12:00"),
				"<p><a href='http://www.manchesterfilmcoop.uk/wp-content/uploads/2014/09/The-Brussels-Business-Web.jpg'><img class='alignright size-medium wp-image-1126' src='http://www.manchesterfilmcoop.uk/wp-content/uploads/2014/09/The-Brussels-Business-Web-212x300.jpg' alt='The-Brussels-Business-Web' width='212' height=“300' /></a>Manchester Film Co-operative would like to invite you to a screening of the documentary film The Brussels Business.</p> <p>In the early 90s two young men discover the enormous influence of lobbying in Brussels. One becomes the leading lobby-watchdog in Brussels, the other one becomes a top lobbyist on world trade issues, representing 50% of the EU&#8217;s economy &#8211; banks, insurances, telecoms, touristic operators and a wide range of business federations.</p> <p>By following one&#8217;s investigations and the other&#8217;s career this film takes us on a journey into the corridors of power of the biggest economy on earth &#8211; the European Union. In the form of a docu-thriller, THE BRUSSELS BUSINESS tries to answer a question millions of Europeans ask themselves: Who runs the European Union?</p> <p>&nbsp;</p> <p><iframe width='645' height='363' src='http://www.youtube.com/embed/JEaK2OteEws?feature=oembed' frameborder='0' allowfullscreen></iframe></p> <p>&nbsp;</p> <p><strong>Date:</strong> Tuesday 28th October 2014, 7pm.</p> <p><strong>Admission (includes free popcorn):</strong><br /> £7 &#8211; solidarity (optional)<br /> £5 &#8211; waged<br /> £3 unwaged/student<br /> Low/No Wage &#8211; donations only</p> <p><strong>Venue:</strong> <a title='Yard Theatre, Hulme' href='http://www.manchesterfilmcoop.uk/find-us/yard-theatre-hulme/'>Yard Theatre, 41 Old Birley Street, Hulme, Manchester. M15 5RF</a></p>"
			);
			expect(result.toShortISOString()).to.equal("2014-10-28T19:00");
		});

		it("should parse a date and time without st/nd/rd/th", function() {
			var result = fetch.findDate(
				new Date("2013-01-19T04:00"),
				"30 January, 4pm"
			);
			expect(result.toShortISOString()).to.equal("2013-01-30T16:00");
		});

		it("should assume afternoon instead of early morning when not told otherwise", function() {
			var result = fetch.findDate(
				new Date("2014-11-01T00:00"),
				"1.45, Sunday 2nd November"
			);
			expect(result.toShortISOString()).to.equal("2014-11-02T13:45");
		});

		it("should assume afternoon instead of early morning when not told otherwise", function() {
			var result = fetch.findDate(
				new Date("2014-11-01T00:00"),
				"6.00, Sunday 2nd November"
			);
			expect(result.toShortISOString()).to.equal("2014-11-02T18:00");
		});

	});
});
