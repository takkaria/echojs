'use strict';

const debug = require('debug')('echo:notify-email');
const models = require('../models');
const notify = require('./notify');
const mail = require('./mail');

if (!mail.sendMail) {
	debug('Not initialising email notifications - no mail sending functionality');
	return;
}

debug('Initialising email notifications');

notify.on('eventSubmitted', function(event_) {
	mail.sendMail({
		template: 'event_submit.html',
		subject: 'Event submitted',
		to: event_.email,
		context: {
			event_: event_
		}
	});
});

notify.on('eventApproved', function(event_) {
	mail.sendMail({
		template: 'event_approve.html',
		subject: 'Event approved!',
		to: event_.email,
		context: {
			event_: event_
		}
	});
});

notify.on('eventRejected', function(event_, message) {
	mail.sendMail({
		template: 'event_reject.html',
		subject: 'Sorry :(',
		to: event_.email,
		context: {
			event_: event_,
			message: message
		}
	});
});

notify.on('eventSubmitted', function(event_) {
	models.User.findAll({
		where: { notify: { $like: 'email' } },
		attributes: [ 'email' ]
	}).then(function(users) {
		if (users.length === 0) return;

		mail.sendMail({
			template: 'event_notify.html',
			subject: 'Event submitted',
			to: users.map(user => user.email).join(','),
			context: {
				event_: event_
			}
		});
	});
});

notify.on('newUser', function(user) {
	mail.sendMail({
		template: 'user_add.html',
		subject: 'New account',
		to: user.email,
		context: {
			user: user
		}
	});
});

notify.on('passwordReset', function(user) {
	mail.sendMail({
		template: 'password_reset.html',
		subject: 'Password Reset',
		to: user.email,
		context: {
			user: user
		}
	});
});
