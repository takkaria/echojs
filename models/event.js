'use strict';

var sequelize = require('sequelize');
var moment = require('moment');
var slug = require('slug');
var textToHTML = require('../lib/texttohtml');

module.exports = function(db) {
	return db.define('event', {
		id: { type: sequelize.INTEGER, primaryKey: true, autoIncrement: true },
		slug: { type: sequelize.TEXT },

		title: {
			type: sequelize.TEXT,
			allowNull: false,
			validate: {
				notEmpty: {
					msg: 'Events must have a title'
				}
			}
		},
		location_text: {
			type: sequelize.TEXT,
		},
		blurb: {
			type: sequelize.TEXT,
			allowNull: false,
			validate: {
				notEmpty: {
					msg: 'Events must have a description'
				}
			}
		},
		type: {
			type: sequelize.TEXT
		},
		url: {
			type: sequelize.TEXT,
			allowNull: true,
			validate: {
				isUrl: {
					msg: 'Please enter a valid URL'
				}
			}
		},
		host: {
			type: sequelize.TEXT,
		},

		startdt: {
			type: sequelize.DATE,
			allowNull: false,
			get: function() {
				let val = this.getDataValue('startdt');
				if (val) {
					let d = moment(val);
					if (d.isValid())
						return d;
				}

				return null;
			}
		},

		enddt: {
			type: sequelize.DATE,
			get: function() {
				let val = this.getDataValue('enddt');
				if (val) {
					let d = moment(val);
					if (d.isValid())
						return d;
				}

				return null;
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
				isEmail: {
					msg: 'Please provide a valid email address'
				}
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

			isMultiDay: function() {
				if (!this.enddt)
					return false;
				return !this.startdt.isSame(this.enddt, 'day');
			},

			length: function(unit) {
				if (!this.enddt) return;
				return this.enddt.diff(this.startdt, unit);
			},

			blurbAsHTML: function(opts) {
				return textToHTML(this.blurb, opts);
			},

			shortBlurb: function(readMore) {
				if (readMore === undefined)
					readMore = true;

				// Copy blurb so we don't alter the event object itself
				var altered = this.blurb.slice(0);

				// FIXME: This could be done with more finesse
				if (altered.length >= 140) {
					altered = altered.substr(0, 139) + (readMore ? '… <i>(read more)</i>' : '...');
				}

				// Split up any long strings of characters without a space
				return altered.replace(/([\S]{40})/g, '$1&shy;');
			},

			generateSlug: function() {
				if (!this.getDataValue('slug')) {
					var text = slug(this.getDataValue('title')) + '-' + this.id;
					this.setDataValue('slug', text.toLowerCase());
				}

				return this;
			},

			saveAndGenerateSlug: function(opts) {
				// We save it first, then post-save we check the ID and save again
				return this.save(opts).then(function(evt) {
					return evt.generateSlug().save(opts);
				});
			}
		},
		getterMethods: {
			absoluteURL: function() {
				return '/event' +
					moment(this.getDataValue('startdt')).format('[/]YYYY[/]MM/') +
					this.getDataValue('slug');
			},

			shortLocation: function() {
				if (this.location) {
					return this.location.singleLine;
				} else {
					return this.getDataValue('location_text');
				}
			},
		},
		classMethods: {
			// This probably isn't the best place for this but I'm not sure where is -AS
			// Used for unit tests
			_getCurrentTime: function _getCurrentTime() {
				return moment();
			},

			// Iterate through all the start & end dates in the events array and
			// find the latest one.
			getLatestDate: function getLatestDate(events) {
				return events.reduce(function(prev, evt) {
					if (evt.startdt.isAfter(prev))
						prev = evt.startdt;

					if (evt.enddt && evt.enddt.isAfter(prev))
						prev = evt.enddt;

					return prev;
				});
			},

			groupByDays: function(options) {
				let self = this;

				return self.findAll(options).then(function(events) {
					// Find the latest date in our dataset
					let max = self.getLatestDate(events).startOf('day');
					if (events == [] || !max.isValid()) {
						return;
					}

					// Create an dictionary of date to event list
					let indexByDate = {};
					for (let d = self._getCurrentTime().startOf('day');
							!d.isAfter(max);
							d.add(1, 'days')) {
						indexByDate[d.format('YYYY-MM-DD')] = {
							date: d.clone(),
							events: []
						};
					}

					// Group events into either indexByDate or the ongoing pile
					let ongoing = [];
					let one_day_past = self._getCurrentTime().subtract(1, 'days');

					for (let i = 0, len = events.length; i < len; i++) {
						let evt = events[i];

						// Add single day event to current chunk
						if (!evt.isMultiDay() &&
								evt.startdt.isAfter(one_day_past)) {
							indexByDate[evt.startdt.format('YYYY-MM-DD')].events.push(evt);

						// Add long multi-day events to the 'ongoing' pile
						} else if (evt.length('days') > 7) {
							ongoing.push(evt);

						// Short multi-day events get repeated
						} else {
							for (let d = evt.startdt; d.isBefore(evt.enddt); d.add(1, 'days')) {
								indexByDate[d.format('YYYY-MM-DD')].events.push(evt);
							}
						}
					}

					let ordered = [];
					for (let key in indexByDate) {
						let chunk = indexByDate[key];

						if (chunk.events.length > 0) {
							// Add a 'short date' to the display
							// XXX This should be in the display layer!
							if (chunk.date.diff(self._getCurrentTime(), 'days') < 7) {
								chunk.shortDate = chunk.date.calendar();
							}

							ordered.push(chunk);
						}
					}

					return {
						ordered: ordered,
						ongoing: ongoing
					};
				});
			}
		},
		validate: {
			startBeforeEnd: function() {
				if (this.enddt && this.enddt.diff(this.startdt) < 0) {
					throw new Error("Event can't finish after it starts");
				}
			},

			locationEmpty: function() {
				if (!this.location_id &&
						(this.location_text === '' || this.location_text === null)) {
					throw new Error('Events must have a location');
				}
			}
		}
	});
};
