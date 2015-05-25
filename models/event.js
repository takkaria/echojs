var sequelize = require('sequelize');
var url = require('url');
var moment = require('moment');
var marked = require('marked');
var slug = require('slug');

module.exports = function(db) {

	return db.define('event', {
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

			shortBlurb: function(readMore) {
				if (readMore === undefined)
					readMore = true;

				// FIXME: This could be done with more finesse
				if (this.blurb.length >= 180)
					return this.blurb.substr(0, 179) + (readMore ? '… <i>(read more)</i>' : '...');
				return this.blurb;
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

}
