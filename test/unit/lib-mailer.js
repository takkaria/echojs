require('dotenv').load();

var chai = require('chai');
var expect = chai.expect;
chai.use(require('chai-as-promised'));

var Event = require('models').Event;
var mailer = require('lib/mailer');

describe('mailer', function() {
	describe('.sendMail', function() {

		xit('should not crash when sending mail', function() {
			var options = {
				template: 'event_submit.html',
				subject: 'Testing email',
				to: 'andi@takkaria.org',
				context: {
					event_: Event.build({
						title: 'Testing event'
					})
				}
			};

			expect(mailer.sendMail(options)).to.eventually.not.throw();
		});

	});
});
