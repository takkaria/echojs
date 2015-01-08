var sequelize = require('sequelize');
var moment = require('moment');
var url = require('url');
var marked = require('marked');
var crypto = require('crypto');

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
		id: { type: sequelize.INTEGER, primaryKey: true, autoIncrement: true },
		slug: { type: sequelize.TEXT },

		title: {
			type: sequelize.TEXT,
			allowNull: false,
			validate:  {
				notEmpty: true
			}
		},
		location: {
			type: sequelize.TEXT,
			allowNull: false,
			validate: {
				notEmpty: true
			}
		},
		blurb: {
			type: sequelize.TEXT,
			allowNull: false,
			validate: {
				notEmpty: true
			}
		},
		type: {
			type: sequelize.TEXT
		},
		cost: {
			type: sequelize.TEXT,
			allowNull: false,
			validate: {
				notEmpty: true
			}
		},
		url: {
			type: sequelize.TEXT,
			get: function() {
				var urlValue = this.getDataValue('url');
				if (urlValue) {
					var urlObj = url.parse(urlValue);
					urlObj.hostNoWww = urlObj.hostname.replace(/^www\./, "");
					return urlObj;
				}
			}
		},
		host: {
			type: sequelize.TEXT,
			allowNull: false,
			validate: {
				notEmpty: true
			}
		},

		startdt: {
			type: sequelize.DATE,
			get: function() { return moment(this.getDataValue('startdt')); },
			allowNull: false,
			validate: {
				notEmpty: true
			}
		},
		enddt: {
			type: sequelize.DATE,
			get: function() { return moment(this.getDataValue('enddt')); }
		},

		state: {
			type: sequelize.ENUM,
			values: [ 'submitted', 'approved', 'imported' ]
		},
		email: {
			type: sequelize.TEXT,
			allowNull: false,
			validate:  {
				isEmail: true
			}
		},
		key: { type: sequelize.TEXT },
		importid: { type: sequelize.TEXT },
	}, {
		timestamps: false,
		createdAt: false,
		underscored: true,
		instanceMethods: {
			blurbAsHTML: function() {
				return marked(this.blurb);
			}
		}
	});

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
	}, {
		timestamps: false,
		createdAt: false,
		underscored: true,
		instanceMethods: {
			checkPassword: function(password) {
				var digest = crypto.createHash('sha256').update(
					this.getDataValue('salt') + password
				).digest('base64');
				return digest === this.getDataValue('digest');
			}
		}
	});

	exports.Post = db.define('post', {
		id: { type: sequelize.TEXT, primaryKey: true },
		link: { type: sequelize.TEXT },
		title: { type: sequelize.TEXT },
		date: {
			type: sequelize.DATE,
			get: function() { return moment(this.getDataValue('date')); }
		},
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
