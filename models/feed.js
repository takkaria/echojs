var sequelize = require('sequelize');

module.exports = function(db) {
	return db.define('feed', {
		id: { type: sequelize.TEXT, primaryKey: true },
		site_url: { type: sequelize.TEXT },
		title: { type: sequelize.TEXT },
		errors: { type: sequelize.TEXT },
	}, {
		timestamps: false,
		createdAt: false,
		underscored: true
	});
};
