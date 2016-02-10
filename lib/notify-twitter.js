'use strict';

var twitter = require('twitter');
var debug = require('debug')('echo:notify-twitter');
var models = require('../models');

var notify = require('./notify');
var logger = require('./logger');

if (process.env.TWITTER_CONSUMER_KEY === undefined) {
	logger.info('Twitter notifications disabled as no key provided')
} else {
	debug('Initialising twitter notifications');

	let client = new twitter({
		consumer_key: process.env.TWITTER_CONSUMER_KEY,
		consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
		access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
		access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
	});

	function sendDirectMessage(params) {
		client.post('direct_messages/new', {
			screen_name: params.to,
			text: params.text
		}, function(error, response) {
			if (error) {
				logger.error(
						'Error sending new event tweet to %s',
						params.to, error);
			}
		})
	}

	notify.on('eventSubmitted', function(evt) {
		return models.User.findAll({
			where: { notify: { $like: 'twitter' } },
			attributes: [ 'twitter' ]
		}).then(function(users) {
			for (let user of users) {
				if (user.twitter) {
					sendDirectMessage({
						to: user.twitter,
						text: 'New event added: "' + evt.title + '" submitted'
					});
				}
			}
		});
	});
}
