'use strict';

const expect = require('chai').expect;
const fetchCalendar = require('../../lib/fetch-calendar');

describe('fetch-calendar', function() {
	it('must call the callback', function(done) {
		fetchCalendar(null, done);
	})
})
