'use strict';

var logger = require('./logger');
if (!process.env.SMTP_HOST) {
	logger.info('Mail sending disabled as no server specified');
	return;
}

var nodemailer = require('nodemailer');
var Promise = require('promise');
var EmailTemplates = require('swig-email-templates');
var path = require('path');
var debug = require('debug')('echo:notify-email');

var models = require('../models');
var notify = require('./notify');

debug('Initialising email notifications');

var templates = new EmailTemplates({
	root: path.join(__dirname, '../views/mail/')
});

var transport = nodemailer.createTransport({
	host: process.env.SMTP_HOST,
	secure: process.env.SMTP_SECURE ? true : false,
	auth: {
		user: process.env.SMTP_USER,
		pass: process.env.SMTP_PASS
	},
	logger: logger
});

templates.renderPromise = Promise.denodeify(templates.render);
transport.sendMailPromise = Promise.denodeify(transport.sendMail);

function sendMail(mail) {
	return templates.renderPromise(mail.template, mail.context).then(function(html) {
		return transport.sendMailPromise({
			from: process.env.SMTP_FROM || 'testing@example.net',
			to: mail.to,
			subject: '[Echo] ' + mail.subject,
			html: html,
			generateTextFromHTML: true
		});
	}).then(function(info) {
		logger.log('info', 'Message sent to ' + mail.to, info);
	}).catch(function(err) {
		logger.log('error', 'Error during message sending', err);
	})
}

notify.on('eventSubmitted', function(event_) {
	sendMail({
		template: 'event_submit.html',
		subject: 'Event submitted',
		to: event_.email,
		context: {
			event_: event_
		}
	})
});

notify.on('eventApproved', function(event_) {
	sendMail({
		template: 'event_approve.html',
		subject: 'Event approved!',
		to: event_.email,
		context: {
			event_: event_
		}
	})
});

notify.on('eventRejected', function(event_, message) {
	sendMail({
		template: 'event_reject.html',
		subject: 'Sorry :(',
		to: event_.email,
		context: {
			event_: event_,
			message: message
		}
	})
});

notify.on('eventSubmitted', function(event_) {
	models.User.findAll({
		where: { notify: { $like: 'email' } },
		attributes: [ 'email' ]
	}).then(function(users) {
		sendMail({
			template: 'event_notify.html',
			subject: 'Event submitted',
			to: users.map(user => user.email).join(','),
			context: {
				event_: event_
			}
		});
	})
});

notify.on('newUser', function(user) {
	sendMail({
		template: 'user_add.html',
		subject: 'New account',
		to: user.email,
		context: {
			user: user
		}
	});
});

notify.on('passwordReset', function(user) {
	sendMail({
		template: 'password_reset.html',
		subject: 'Password Reset',
		to: user.email,
		context: {
			user: user
		}
	})
});
