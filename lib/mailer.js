var nodemailer = require("nodemailer"),
	emailTemplates = require('swig-email-templates'),
	path = require('path'),
	debug = require('debug'),
	mailTemplateOptions = {
		root: path.join(__dirname, "../views/mail/")
	},
	smtpTransport = nodemailer.createTransport();

function htmlifyText(text) {
	var html =	text.replace(/\r\n\r\n/g, "</p><p>").replace(/\n\n/g, "</p><p>");
	html = html.replace(/\r\n/g, "<br />").replace(/\n/g, "<br />");
	return html;
}

function sendMail(mail) {
	emailTemplates(mailTemplateOptions, function(err, render, generateDummy) {
		render(mail.template, mail.context, function(err, html) {
			smtpTransport.sendMail({
				from: "Echo <support@echomanchester.org>",
				to: mail.to,
				subject: '[Echo] ' + mail.subject,
				html: html
			}, function(error, response) {
				if (error) {
					debug(error);
				} else {
					debug("Message sent: " + response.message);
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
		mailer.sendMail({
			template: 'event_approve.html',
			subject: 'Event approved!',
			to: event_.email,
			context: {
				event_: event_
			}
		});
	},

	// Send rejection notiication to event submitter
	sendEventRejectedMail: function (event_) {
		mailer.sendMail({
			template: 'event_reject.html',
			subject: 'Sorry :(',
			to: event_.email,
			context: {
				event_: event_
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
