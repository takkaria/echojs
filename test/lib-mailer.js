require('dotenv').load();

var expect = require('chai').expect;
var Event = require('../models').Event;
var mailer = require('../lib/mailer');

var utils = require('./_utils');

describe('mailer', function() {
	describe('.sendMail', function() {

		xit('should not crash when sending mail', function(done) {
			mailer.sendMail({
				template: 'event_submit.html',
				subject: 'Testing email',
				to: 'andi@takkaria.org',
				context: {
					event_: Event.build({
						title: 'Testing event'
					})
				}
			}).then(function(info) {
				done();
			});
		});

	});
});
