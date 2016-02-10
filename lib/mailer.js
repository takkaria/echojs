'use strict';

var nodemailer = require('nodemailer');
var Promise = require('promise');
var EmailTemplates = require('swig-email-templates');
var path = require('path');
var debug = require('debug')('echo:mailer');
var logger = require('./logger');

var templates = new EmailTemplates({
	root: path.join(__dirname, '../views/mail/')
});

var transport = nodemailer.createTransport({
	host: process.env.SMTP_HOST,
	secure: process.env.SMTP_SECURE ? true : false,
	auth: {
		user: process.env.SMTP_USER,
		pass: process.env.SMTP_PASS,
	},
	logger: logger
});

templates.renderPromise = Promise.denodeify(templates.render);
transport.sendMailPromise = Promise.denodeify(transport.sendMail);

function sendMail(mail) {
	return templates.renderPromise(mail.template, mail.context).then(function(html) {
		if (process.env.SMTP_NOSEND) {
			debug('Not sending email to ' + mail.to + ' with template ' + mail.template);
			return;
		}

		return transport.sendMailPromise({
			from: process.env.SMTP_FROM || 'testing@example.net',
			to: mail.to,
			subject: '[Echo] ' + mail.subject,
			html: html,
			generateTextFromHTML: true
		});
	}).then(function(info) {
		logger.log('info', 'Message sent to ' + mail.to, info);
		return info;
	}).catch(function(err) {
		logger.log('error', 'Error during message sending', err);
	});
}

module.exports = {
	sendMail: sendMail,

	// Send confirmation to submitter of an event
	sendEventSubmittedMail: function(event_) {
		return sendMail({
			template: 'event_submit.html',
			subject: 'Event submitted',
			to: event_.email,
			context: {
				event_: event_
			}
		});
	},

	// Send approval notiication to event submitter
	sendEventApprovedMail: function(event_) {
		return sendMail({
			template: 'event_approve.html',
			subject: 'Event approved!',
			to: event_.email,
			context: {
				event_: event_
			}
		});
	},

	// Send rejection notiication to event submitter
	sendEventRejectedMail: function(event_, message) {
		return sendMail({
			template: 'event_reject.html',
			subject: 'Sorry :(',
			to: event_.email,
			context: {
				event_: event_,
				message: message
			}
		});
	},

	// Notify interested admins of new event
	sendAdminsEventNotifyMail: function(models, event_) {
		return models.User.findAll({
			where: { notify: 1 },
			attributes: [ 'email' ]
		}).then(function(users) {
			return sendMail({
				template: 'event_notify.html',
				subject: 'Event submitted',
				to: users.map(user => user.email).join(','),
				context: {
					event_: event_
				}
			});
		})
	},

	// Notify a new user of their begetting
	sendNewUserMail: function(user) {
		return sendMail({
			template: 'user_add.html',
			subject: 'New account',
			to: user.email,
			context: {
				user: user
			}
		});
	},

	// Send a notification of password reset
	sendPasswordResetMail: function(user) {
		return sendMail({
			template: 'password_reset.html',
			subject: 'Password Reset',
			to: user.email,
			context: {
				user: user
			}
		});
	}

};
