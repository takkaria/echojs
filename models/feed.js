var sequelize = require('sequelize');

module.exports = function(db) {
	return db.define('feed', {
		id: { type: sequelize.INTEGER, primaryKey: true, autoIncrement: true },
		feedURL: { type: sequelize.TEXT },
		siteURL: { type: sequelize.TEXT },
		title: { type: sequelize.TEXT },
		errors: { type: sequelize.TEXT },
	});
};
