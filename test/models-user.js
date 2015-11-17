var expect = require('chai').expect;
var User = require('../models').User;
var bcrypt = require('bcrypt');

describe('User', function() {
	describe('.resetPassword', function() {

		it('should alter pwtoken', function() {
			var u = User.build({
				email: 'text@test.test'
			});

			u.resetPassword();
			expect(u.pwtoken).to.not.equal(null);
		});
	});

	describe('.setPassword', function() {
		it('should alter digest', function(done) {
			var u = User.build();
			u.setPassword('testing-string').then(function() {
				expect(u.digest).to.not.equal(null);
				done();
			});
		});

		it('should use bcrypt', function(done) {
			var u = User.build();
			u.setPassword('testing-string').then(function() {
				expect(u.digest).to.match(/^\$2/);
				done();
			});
		});
	});


	describe('.checkPassword', function() {

		describe('bcrypt functionality', function() {
			var pw = 'testing-pw';
			var u = User.build();

			before(function(done) {
				u.setPassword(pw).then(function() {
					done();
				});
			});

			it('should promise-return true for a correct password', function(done) {
				u.checkPassword(pw).then(function(result) {
					expect(result).to.equal(true);
					done();
				});
			});

			it('should promise-return false for an incorrect password', function(done) {
				u.checkPassword(pw + '555').then(function(result) {
					expect(result).to.equal(false);
					done();
				});
			});
		});

		describe('sha256 functionality', function() {
			var pw = 'test';
			var u = User.build({
				salt: 'aaa',
				digest: 'e3MjCoP7Oui8bQ+BK+2wWIRmq/OApZ8nXNuv6Kt6qiw='
			});

			it('should promise-return true for a correct password', function(done) {
				u.checkPassword(pw).then(function(result) {
					expect(result).to.equal(true);
					done();
				});
			});

			it('should promise-return false for an incorrect password', function(done) {
				u.checkPassword(pw + '555').then(function(result) {
					expect(result).to.equal(false);
					done();
				});
			});
		});

	});

});
