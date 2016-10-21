var chai = require('chai');
var expect = chai.expect;
chai.use(require('chai-as-promised'));

var User = require('models').User;

describe('User', function() {
	describe('.resetPassword', function() {

		it('should be chainable', function() {
			var u = User.build({
				email: 'text@test.test'
			});

			expect(u.resetPassword()).to.equal(u);
		});

		it('should alter pwtoken', function() {
			var u = User.build({
				email: 'text@test.test'
			});

			u.resetPassword();
			expect(u.pwtoken).to.not.equal(null);
		});
	});

	describe('.setPassword', function() {
		it('should resolve to user object', function() {
			var u = User.build();
			expect(u.setPassword('testing-string')).to.eventually.equal(u);
		});

		it('should alter digest', function() {
			var u = User.build();
			return u.setPassword('testing-string').then(function() {
				expect(u.digest).to.not.equal(null);
			});
		});

		it('should use bcrypt', function() {
			var u = User.build();
			return u.setPassword('testing-string').then(function() {
				expect(u.digest).to.match(/^\$2/);
			});
		});
	});

	describe('.checkPassword', function() {

		describe('bcrypt functionality', function() {
			var pw = 'testing-pw';
			var u = User.build();

			before(function() {
				return u.setPassword(pw);
			});

			it('should promise-return true for a correct password', function() {
				expect(u.checkPassword(pw)).to.eventually.equal(true);
			});

			it('should promise-return false for an incorrect password', function() {
				expect(u.checkPassword(pw + '555')).to.eventually.equal(false);
			});
		});

		describe('sha256 functionality', function() {
			var pw = 'test';
			var u = User.build({
				salt: 'aaa',
				digest: 'e3MjCoP7Oui8bQ+BK+2wWIRmq/OApZ8nXNuv6Kt6qiw='
			});

			it('should promise-return true for a correct password', function() {
				expect(u.checkPassword(pw)).to.eventually.equal(true);
			});

			it('should promise-return false for an incorrect password', function() {
				expect(u.checkPassword(pw + '555')).to.eventually.equal(false);
			});
		});

	});

});
