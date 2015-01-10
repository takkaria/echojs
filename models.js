var sequelize = require('sequelize'),
	moment = require('moment'),
	url = require('url'),
	marked = require('marked'),
	crypto = require('crypto'),
	slug = require('slug');

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
			values: [ 'submitted', 'approved', 'imported', 'hidden' ]
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
			},

			generateSlug: function() {
				if (!this.getDataValue('slug')) {
					var text = slug(this.getDataValue('title')) + "-" + this.id;
					this.setDataValue('slug', text.toLowerCase());
				}
				return this;
			}
		},
		getterMethods: {
			absolute_url: function() {
				var url = moment(this.getDataValue('startdt')).format('[/]YYYY[/]MM/') + this.getDataValue('slug');
				return '/event'
					+ moment(this.getDataValue('startdt')).format('[/]YYYY[/]MM/')
					+ this.getDataValue('slug');
			}
		}
	});

	exports.User = db.define('user', {
		email: {
			type: sequelize.TEXT,
			primaryKey: true,
			allowNull: false,
			validate:  {
				isEmail: true
			}
		},
		id: { type: sequelize.INTEGER, autoIncrement: true },
		salt: {
			type: sequelize.TEXT,
			get: function() {
				var salt = this.getDataValue('salt');
				if ((salt === '')||(typeof(salt) === 'undefined')) {
					salt = crypto.randomBytes(256).toString('base64');
					this.setDataValue('salt', salt);
				}
				return salt;
			}
		},
		digest: { type: sequelize.TEXT },

		pwreset: { type: sequelize.TEXT },
		notify: { type: sequelize.BOOLEAN },
		rights: {
			type: sequelize.ENUM,
			values: [ "admin", "editor" ],
			allowNull: false
		}
	}, {
		timestamps: false,
		createdAt: false,
		underscored: true,
		instanceMethods: {
			setPassword: function(password) {
				var salt = this.salt;
				var digest = crypto.createHash('sha256').update(salt + password).digest('base64');
				console.log('digest: ' + digest);
				this.setDataValue('digest', digest);
			},
			checkPassword: function(password) {
				var digest = crypto.createHash('sha256').update(
					this.salt + password
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
