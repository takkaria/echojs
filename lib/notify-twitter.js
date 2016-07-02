'use strict';

const debug = require('debug')('echo:notify-twitter');
const models = require('../models');
const notify = require('./notify');
const twitter = require('./twitter');

if (!twitter.sendDirectMessage) {
	debug('Not initialising email notifications - no twitter functionality');
	return;
}

debug('Initialising twitter notifications');

notify.on('eventSubmitted', function(evt) {
	return models.User.findAll({
		where: { notify: { $like: 'twitter' } },
		attributes: [ 'twitter' ]
	}).then(function(users) {
		for (let user of users) {
			if (user.twitter) {
				twitter.sendDirectMessage({
					to: user.twitter,
					text: 'New event added: "' + evt.title + '" submitted'
				});
			}
		}
	});
});
