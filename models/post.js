var sequelize = require('sequelize');
var moment = require('moment');

module.exports = function(db) {
	return db.define('post', {
		id: { type: sequelize.TEXT, primaryKey: true },
		link: { type: sequelize.TEXT },
		title: { type: sequelize.TEXT },
		date: {
			type: sequelize.DATE,
			get: function() { return moment(this.getDataValue('date')); }
		},
		hidden: { type: sequelize.INTEGER }
	}, {
		timestamps: false,
		createdAt: false,
		underscored: true
	});
};
