'use strict';

const chai = require('chai');
const expect = chai.expect;
chai.use(require('chai-as-promised'));

var stats = require('../../models').Stats;

describe('Stats', function() {
	it('should exist', function() {
		expect(stats).to.exist;
	})
})
