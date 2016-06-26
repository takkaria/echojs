'use strict';

const logger = require('./logger');

if (!process.env.SMTP_HOST) {
	logger.info('Mail sending disabled as no server specified');
	return;
}

const nodemailer = require('nodemailer');
const EmailTemplates = require('swig-email-templates');
const path = require('path');

const templates = new EmailTemplates({
	root: path.join(__dirname, '../views/mail/')
});

const transport = nodemailer.createTransport({
	host: process.env.SMTP_HOST,
	secure: process.env.SMTP_SECURE ? true : false,
	auth: {
		user: process.env.SMTP_USER,
		pass: process.env.SMTP_PASS
	},
	logger: logger
});

function sendMail(mail) {
	templates.render(mail.template, mail.context, function(err, html, text) {
		if (err) {
			logger.log('error', 'Error during message sending', err);
			return;
		}

		transport.sendMail({
			from: process.env.SMTP_FROM || 'testing@example.net',
			to: mail.to,
			subject: '[Echo] ' + mail.subject,
			html: html,
			text: text
		}, function(err, info) {
			if (err) {
				logger.log('error', 'Error during message sending', err);
				return;
			}

			logger.log('info', 'Message sent to ' + mail.to, info);
		});
	});
}

module.exports = {
	sendMail: sendMail
}
