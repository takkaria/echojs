var nodemailer = require("nodemailer"),
	emailTemplates = require('swig-email-templates'),
	path = require('path'),
	debug = require('debug')('echo:mailer'),
	mailTemplateOptions = {
		root: path.join(__dirname, "../views/mail/")
	},
	transport = nodemailer.createTransport({
		host: process.env.SMTP_HOST,
		secure: process.env.SMTP_SECURE ? true : false,
		auth: {
			user: process.env.SMTP_USER,
			pass: process.env.SMTP_PASS,
		}
	});

function sendMail(mail) {
	emailTemplates(mailTemplateOptions, function(err, render, generateDummy) {
		if (err) {
			debug(err);
			return;
		}

		render(mail.template, mail.context, function(err, html) {
			if (err) {
				debug(err);
				return;
			}

			if (process.env.SMTP_NOSEND) {
				debug("Not sending email to " + mail.to + " with template " + mail.template);
				return;
			}

			transport.sendMail({
				from: process.env.SMTP_FROM || "testing@example.net",
				to: mail.to,
				subject: '[Echo] ' + mail.subject,
				html: html,
				generateTextFromHTML: true
			}, function(error, info) {
				if (error) {
					debug(error);
				} else {
					debug("Message sent: " + info.response);
				}
			});
		});
	});
};

module.exports = {
	sendMail: sendMail,

	// Send confirmation to submitter of an event
	sendEventSubmittedMail: function (event_) {
		sendMail({
			template: 'event_submit.html',
			subject: 'Event submitted',
			to: event_.email,
			context: {
				event_: event_
			}
		});
	},

	// Send approval notiication to event submitter
	sendEventApprovedMail: function (event_) {
		sendMail({
			template: 'event_approve.html',
			subject: 'Event approved!',
			to: event_.email,
			context: {
				event_: event_
			}
		});
	},

	// Send rejection notiication to event submitter
	sendEventRejectedMail: function (event_, message) {
		sendMail({
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
	sendAdminsEventNotifyMail: function (models, event_) {
		models.User.findAll({
			where: { notify: 1 },
			attributes: [ 'email' ]
		}).then(function (emails){
			var emails = emails.map(function(value, i, array) {
				return value.email;
			});
			debug(emails.join(','));
			sendMail({
				template: 'event_notify.html',
				subject: 'Event submitted',
				to: emails.join(','),
				context: {
					event_: event_
				}
			});
		});
	},

	// Notify a new user of their begetting
	sendNewUserMail: function (user) {
		sendMail({
			template: 'user_add.html',
			subject: 'New account',
			to: user.email,
			context: {
				user: user
			}
		});
	},

	// Send a notification of password reset
	sendPasswordResetMail: function (user) {
		sendMail({
			template: 'password_reset.html',
			subject: 'Password Reset',
			to: user.email,
			context: {
				user: user
			}
		});
	}

};
