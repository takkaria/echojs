var sequelize = require('sequelize');
var url = require('url');
var moment = require('moment');
var ModifiedRenderer = require('../lib/marked-mod-render');
var marked = require('marked');
var slug = require('slug');

moment.locale('en-shortDate', {
	calendar: {
		sameDay:  '[Today]',
		nextDay:  '[Tomorrow]',
		nextWeek: 'dddd'
	}
});

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
		},
		enddt: {
			type: sequelize.DATE,
			get: function() {
				var val = this.getDataValue('enddt');
				if (val) {
					var d = moment(val);
					return (d.isValid() ? d : null);
				}
			}
		},
		allday: { type: sequelize.BOOLEAN },

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
				return marked(this.blurb, {
					renderer: ModifiedRenderer // new marked.Renderer
				});
			},
			isMultiDay: function() {
				if (!this.enddt)
					return false;
				return !this.startdt.isSame(this.enddt, 'day');
			},

			shortBlurb: function(readMore) {
				if (readMore === undefined)
					readMore = true;

				// Copy blurb so we don't alter the event object itself
				var altered = this.blurb.slice(0);

				// FIXME: This could be done with more finesse
				if (altered >= 180) {
					altered = altered.substr(0, 179) + (readMore ? '… <i>(read more)</i>' : '...');
				}

				// Split up any long strings of characters without a space
				return altered.replace(/([\S]{40})/g, '$1&shy;');
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
				var max,
					Event = this;

				Event.max('enddt').then(function(_max) {
					max = _max;

					Event.findAll(options).then(function(events) {
						// This will look like
						// [ { date: moment, events: [ models.Event(), models.Event(), ... ] }, ... ]
						var ordered = {},
							chunk,
							last,
							ongoing = [],
							list = [],
							one_day_past = moment().subtract(1, 'days');

						for (var d = moment().locale('en-shortDate'); d.isBefore(max); d.add(1, 'days')) {
							var chunk = {
								date: d,
								longDate: d.format("dddd, Do MMMM YYYY"),
								events: []
							}

							if (d.diff(moment(), 'days') < 7) {
								chunk.shortDate = d.calendar();
							}

							ordered[d.format('YYYY-MM-DD')] = chunk;
						}

						// Group events by date
						events.forEach(function(e) {
							// Add event to current chunk
							if (!e.isMultiDay()
									&& e.startdt.isAfter(one_day_past)) {
								return ordered[e.startdt.format('YYYY-MM-DD')].events.push(e);
							}

							if (e.enddt.diff(e.startdt, 'days') > 7){
								return ongoing.push(e);
							}

							for (var d_ = e.startdt.isBefore(one_day_past) ? moment() : e.startdt;
									d_.isBefore(e.enddt);
									d_.add(1, 'days')) {
								ordered[d_.format('YYYY-MM-DD')].events.push(e);
							}
						});

						for (var key in ordered) {
							if (ordered[key].events.length > 0)
								list.push(ordered[key]);
						}

						list.push({
							longDate: 'Ongoing',
							events: ongoing,
							is_ongoing: true
						});

						return callback(list);
					});
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
