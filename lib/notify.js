'use strict';

const EventEmitter = require('events');

class Notifier extends EventEmitter {
	eventSubmitted(evt) {
		this.emit('eventSubmitted', evt)
	}

	eventApproved(evt) {
		this.emit('eventApproved', evt)
	}

	eventRejected(evt, message) {
		this.emit('eventRejected', evt, message)
	}

	newUser(user) {
		this.emit('newUser', user)
	}

	passwordReset(user) {
		this.emit('passwordReset', user)
	}
};

let notifier = new Notifier();
notifier.on('error', function(err) {
	logger.error(err);
});

module.exports = notifier;
