'use strict';

const sequelize = require('sequelize');

class StatsSingleton {
	constructor(db) {
		this.db = db.define('stat', {
			id: { type: sequelize.TEXT, primaryKey: true },
			value: { type: sequelize.TEXT },
		});
	}

	setValue(key, value) {
		return Promise.resolve();
	}
}

module.exports = function(db) {
	return new StatsSingleton(db);
}
