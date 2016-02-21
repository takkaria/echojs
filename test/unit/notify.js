'use strict';

var chai = require('chai');
var expect = chai.expect;

var notify = require('lib/notify');

describe('notify', function() {
	describe('.on', function() {
		let callbackCalled = false;
		let callback = () => { callbackCalled = true };

		it('should respond', function() {
			expect(notify).to.respondTo('on');
		});

		it('should register an event handler', function() {
			notify.on('eventSubmitted', callback);
			expect(notify.listenerCount('eventSubmitted') == 1);
		});

		it('... and that event handler should be triggered', function() {
			notify.eventSubmitted();
			expect(callbackCalled).to.equal(true);
		});
	});

	let eventList = [
		'eventSubmitted', 'eventRejected', 'eventApproved', 'newUser', 'passwordReset'
	];

	for (let evt of eventList) {
		describe('.' + evt, function() {
			it('should respond', function() {
				expect(notify).to.respondTo(evt);
			})
		})
	}

})
