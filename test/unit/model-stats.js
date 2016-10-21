'use strict';

const chai = require('chai');
const expect = chai.expect;
chai.use(require('chai-as-promised'));

var stats = require('../../models').Stats;

describe('Stats', function() {
	it('should exist', function() {
		expect(stats).to.exist;
	})

	const TESTING_KEY = 'testing';
	const TESTING_VALUE = 5;

	describe('setting a value', function() {
		it('should not produce an error', function() {
			return stats.setValue(TESTING_KEY, TESTING_VALUE);
		})
	})

	describe('fetching it back', function() {
		it('should produce the same value', function() {
			return stats.getValue(TESTING_KEY).then((val) => {
				expect(val).to.equal(TESTING_VALUE);
			})
		})
	})
})
