'use strict';

const sequelize = require('sequelize');

class StatsSingleton {
	constructor(db) {
		this.db = db.define('stat', {
			key: { type: sequelize.TEXT, primaryKey: true },
			value: { type: sequelize.TEXT }
		}, {
			timestamps: false,
			createdAt: false
		});
	}

	setValue(key, value) {
		return this.db.findById(key).then(stat => {
			stat = stat || this.db.build({ key: key })
			stat.value = JSON.stringify(value);
			return stat.save();
		})
	}

	getValue(key) {
		return this.db.findById(key).then(stat => stat ? JSON.parse(stat.value) : null);
	}
}

module.exports = function(db) {
	return new StatsSingleton(db);
}
