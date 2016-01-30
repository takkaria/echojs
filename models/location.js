var sequelize = require('sequelize');
var marked = require('marked');

module.exports = function(db) {
	return db.define('location', {
		id: { type: sequelize.INTEGER, primaryKey: true, autoIncrement: true },
		name: {
			type: sequelize.TEXT,
			allowNull: false,
			validate:  {
				notEmpty: true
			},
		},
		address: {
			type: sequelize.TEXT,
			allowNull: false,
			validate:  {
				notEmpty: true
			},
		},
		description: { type: sequelize.TEXT },

		longitude: {
			type: sequelize.FLOAT,
			allowNull: false,
			validate:  {
				notEmpty: true
			},
		},
		latitude: {
			type: sequelize.FLOAT,
			allowNull: false,
			validate:  {
				notEmpty: true
			},
		},
	}, {
		timestamps: false,
		createdAt: false,
		underscored: true,
		instanceMethods: {
			addressAsHTML: function() {
				return this.getDataValue('address').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1<br>');
			},

			descriptionAsHTML: function() {
				var d = this.getDataValue('description');
				return d ? marked(d) : null;
			},
		},
		getterMethods: {
			singleLine: function() {
				return this.name + ', ' + this.address.replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1, ');
			},
		},
	});
};
