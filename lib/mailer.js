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

module.exports = {
	sendMail : function(mail) {
		emailTemplates(mailTemplateOptions, function(err, render, generateDummy) {
			render(mail.template, mail.context, function(err, html) {
				smtpTransport.sendMail({
					from: "Echo <info@echomanchester.org>",
					to: mail.to,
					subject: '[Echo] ' + mail.subject,
					html: html
				}, function(error, response){
					if(error){
						debug(error);
					} else{
						debug("Message sent: " + response.message);
					}
				});
			});
		});
	}
};
