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
		storage: process.env.DBPATH || 'db.sqlite',
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
		location_text: {
			type: sequelize.TEXT,
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
					urlObj.toString = function() {
						return urlValue;
					}
					return urlObj;
				}
			}
		},
		host: {
			type: sequelize.TEXT,
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
			get: function() {
				var d = moment(this.getDataValue('enddt'));
				return (d.isValid() ? d : null);
			}
		},

		state: {
			type: sequelize.ENUM,
			values: [ 'submitted', 'approved', 'imported', 'hidden' ]
		},
		email: {
			type: sequelize.TEXT,
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
			isImported: function() {
				return this.importid ? true : false;
			},
			blurbAsHTML: function() {
				return marked(this.blurb);
			},

			shortBlurb: function() {
				// FIXME: This could be done with more finesse
				return this.blurb.substr(0, 180);
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
			},

			shortLocation: function() {
				if (this.location) {
					return this.location.singleLine;
				} else {
					return this.getDataValue('location_text');
				}
			}
		},
		classMethods: {
			groupByDays: function(options, callback) {
				this.findAll(options).then(function(events) {
					// This will look like
					// [ { date: moment, events: [ models.Event(), models.Event(), ... ] }, ... ]
					var ordered = [];
					var chunk;
					var last;

					// Group events by date
					events.forEach(function(event) {
						var date = event.startdt.format("YYYY-MM-DD");

						// Create a new grouping ('chunk') for a different date
						if (date != last) {
							chunk = {};
							chunk.date = moment(date);
							chunk.longDate = chunk.date.format("dddd, Do MMMM YYYY");
							chunk.events = [];

							if (chunk.date.diff(moment(), 'days') < 7)
								chunk.shortDate = chunk.date.calendar();

							ordered.push(chunk);

							// Remember date for next iteration
							last = date;
						}

						// Add event to current chunk
						chunk.events.push(event);
					});

					return callback(ordered);
				});
			}
		},
		validate: {
			startBeforeEnd: function() {
				if (this.enddt !== null && this.enddt.diff(this.startdt) < 0) {
					throw new Error("Event can't finish after it starts!")
				}
			},

			locationEmpty: function() {
				if (!this.location_id &&
						(this.location_text === "" || this.location_text === null)) {
					throw new Error("You must provide a location.");
				}
			}
		}
	});

	exports.User = db.define('user', {
		email: {
			type: sequelize.TEXT,
			allowNull: false,
			validate:  {
				isEmail: true,
				isUnique: function(value, next) {
					var id = this.getDataValue('id');

					exports.User.find({
						where: {email: value},
						attributes: ['id']
					}).then(function(user) {
						if (user && user.id !== id)
							return next('email already in use');
						next();
					}).catch(function(err) {
						return next(err);
					});
				}
			}
		},
		id: { type: sequelize.INTEGER, autoIncrement: true, primaryKey: true },
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
			},
			resetPassword: function() {
				var token = crypto.createHash('sha256')
					.update(crypto.pseudoRandomBytes(24))
					.digest('base64');
				this.setDataValue('pwreset', token);
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

	exports.Location = db.define('location', {
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
				return this.name + ", " + this.address.replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1, ');
			},
		},
	});

	exports.Location.hasMany(exports.Event);
	exports.Event.belongsTo(exports.Location);

	exports.Feed.hasMany(exports.Post);
	exports.Post.belongsTo(exports.Feed);

	exports.sequelize = sequelize;

	return exports;
};
