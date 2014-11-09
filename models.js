var sequelize = require('sequelize');

module.exports = function(debug) {
	var exports = {};

	var global_options = {
		timestamps: false,
		createdAt: false,
		underscored: true
	};

	var db = new sequelize('', '', '', {
		dialect: 'sqlite',
		storage: 'db.sqlite',
		logging: debug ? console.log : false,
	});

	exports.Event = db.define('event', {
		id: { type: sequelize.INTEGER, primaryKey: true },

		title: { type: sequelize.TEXT },
		startdt: { type:  sequelize.DATE },
		enddt: { type: sequelize.DATE },
		location: { type: sequelize.TEXT },
		blurb: { type: sequelize.TEXT },
		url: { type: sequelize.TEXT },
		type: { type: sequelize.TEXT },
		cost: { type: sequelize.TEXT },

		state: {
			type: sequelize.ENUM,
			values: [ 'submitted', 'approved', 'imported' ]
		},
		email: { type: sequelize.TEXT },
		key: { type: sequelize.TEXT },
		importid: { type: sequelize.TEXT },
	}, global_options);

	exports.User = db.define('user', {
		email: { type: sequelize.TEXT, primaryKey: true },
		salt: { type: sequelize.TEXT },
		digest: { type: sequelize.TEXT },

		pwreset: { type: sequelize.TEXT },
		notify: { type: sequelize.BOOLEAN },
		rights: {
			type: sequelize.ENUM,
			values: [ "admin", "editor" ]
		}
	}, global_options);

	exports.Post = db.define('post', {
		id: { type: sequelize.TEXT, primaryKey: true },
		link: { type: sequelize.TEXT },
		title: { type: sequelize.TEXT },
		date: { type: sequelize.DATE },
		hidden: { type: sequelize.INTEGER }
	}, global_options);

	exports.Feed = db.define('feed', {
		id: { type: sequelize.TEXT, primaryKey: true },
		site_url: { type: sequelize.TEXT },
		title: { type: sequelize.TEXT },
		errors: { type: sequelize.TEXT },
	}, global_options);

	exports.Feed.hasMany(exports.Post);
	exports.Post.belongsTo(exports.Feed);

	exports.sequelize = sequelize;

	return exports;
};
