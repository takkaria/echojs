'use strict';

const logger = require('./logger');
if (process.env.TWITTER_CONSUMER_KEY === undefined) {
	logger.info('Twitter notifications disabled as no key provided');
	return;
}

const Twitter = require('twitter');

let client = new Twitter({
	consumer_key: process.env.TWITTER_CONSUMER_KEY,
	consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
	access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
	access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

function errorResponseToError(error) {
	return new Error(error[0].code + ": " + error[0].message)
}

function sendDirectMessage(params) {
	client.post('direct_messages/new', {
		screen_name: params.to,
		text: params.text
	}, function(error, response) {
		if (error) {
			logger.error(
					'Error sending new event tweet to %s',
					params.to, error);
		} else {
			logger.info('Tweet successful')
		}
	});
}

function sendTweet(text, cb) {
	client.post('statuses/update', {
		status: text
	}, function(error, tweet, response) {
		if (!cb) return;

		if (error) {
			return cb(errorResponseToError(error));
		}

		cb(null, tweet);
	});
}

module.exports = {
	sendTweet: sendTweet,
	sendDirectMessage: sendDirectMessage
}
