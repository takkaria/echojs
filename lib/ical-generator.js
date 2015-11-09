var a = {
	newCalendar: function() {
		'use strict';

		var cal = {
			domain: null,
			prodid: '//sebbo.net//ical-generator//EN',

			generated: null,
			events: [],

			methods: {
				setDomain: function(domain) {
					cal.domain = domain.toString();
					return cal.methods;
				},
				setProdID: function(id) {
					if(!id || typeof id !== 'object') {
						throw 'prodid is not an object.';
					}
					if(!id.company) {
						throw 'prodid.company is a mandatory item.';
					}
					if(!id.product) {
						throw 'prodid.product is a mandatory item.';
					}
					id.language = (id.language || 'EN').toUpperCase();

					cal.prodid = '//' + id.company + '//' + id.product + '//' + id.language;
					return cal.methods;
				},
				setName: function(name) {
					cal.name = name.toString();
					return cal.methods;
				},
				setTTL: function(ttl) {
					cal.ttl = ttl.toString();
					return cal.methods;
				},
				setTZ: function(tz) {
					cal.tz = tz.toString();
					return cal.methods;
				},
				addEvent: function(e) {
					var _event = {},
						allowedMethods = ['PUBLISH', 'REQUEST', 'REPLY', 'ADD', 'CANCEL', 'REFRESH', 'COUNTER', 'DECLINECOUNTER'],
						allowedRepeatingFreq = ['SECONDLY', 'MINUTELY', 'HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'],
						allowedStatuses = ['CONFIRMED', 'TENATIVE', 'CANCELLED'];

					if(!e || typeof e !== 'object') {
						throw 'event is not an object.';
					}

					// UID
					_event.uid = e.uid || ("0000" + (Math.random()*Math.pow(36,4) << 0).toString(36)).substr(-4);

					// Date Start
					if(!e.start) {
						throw 'event.start is a mandatory item.';
					}
					if(Object.prototype.toString.call(e.start) !== '[object Date]') {
						throw 'event.start must be a Date Object.';
					}
					_event.start = e.start;

					_event.tz = e.tz || undefined;

					// Repeating Event
					if(e.repeating) {
						_event.repeating = {};

						if(!e.repeating.freq || allowedRepeatingFreq.indexOf(e.repeating.freq.toUpperCase()) === -1) {
							throw 'event.repeating.freq is a mandatory item, and must be one of the following: ' + allowedRepeatingFreq.join(', ');
						}

						_event.repeating.freq = e.repeating.freq;

						if(e.repeating.count) {
							if(!isFinite(e.repeating.count)) {
								throw 'event.repeating.count must be a Number.';
							}

							_event.repeating.count = e.repeating.count;
						}

						if(e.repeating.interval) {
							if(!isFinite(e.repeating.interval)) {
								throw 'event.repeating.interval must be a Number.';
							}

							_event.repeating.interval = e.repeating.interval;
						}

						if(e.repeating.until) {
							if(Object.prototype.toString.call(e.repeating.until) !== '[object Date]') {
								throw 'event.repeating.until must be a Date Object.';
							}

							_event.repeating.until = e.repeating.until;
						}
					}

					// allDay flag
					_event.allDay = e.allDay ? true : false;

					// Date Stamp
					if(e.stamp && Object.prototype.toString.call(e.stamp) !== '[object Date]') {
						throw 'event.stamp must be a Date Object.';
					}
					_event.stamp = e.stamp;

					// Summary
					if(!e.summary) {
						throw 'event.summary is a mandatory item.';
					}
					_event.summary = e.summary;

					// Location
					_event.location = e.location || null;

					// Description
					_event.description = e.description || null;

					// Organizer
					_event.organizer = null;
					if(e.organizer && typeof e.organizer === 'object') {
						if(!e.organizer.name) {
							throw 'event.organizer.name is empty.';
						}
						if(!e.organizer.email) {
							throw 'event.organizer.email is empty.';
						}

						_event.organizer = {
							name: e.organizer.name,
							email: e.organizer.email
						};
					}

					// Method
					if(e.method && allowedMethods.indexOf(e.method.toUpperCase()) === -1) {
						throw 'event.method must be one of the following: ' + allowedMethods.join(', ');
					}
					_event.method = e.method;

					// Status
					if(e.status && allowedStatuses.indexOf(e.status.toUpperCase()) === -1) {
						throw 'event.status must be one of the following: ' + allowedStatuses.join(', ');
					}
					_event.status = e.status;

					// URL
					_event.url = e.url || null;

					cal.generated = null;
					cal.events.push(_event);
					return cal.methods;
				},
				generate: function() {
					var g;

					function _formatDate(d, dateonly, z_terminate) {
						var s;

						function pad(i) {
							return (i < 10 ? '0': '') + i;
						}

						s = d.getUTCFullYear();
						s += pad(d.getUTCMonth() + 1);
						s += pad(d.getUTCDate());

						if(!dateonly) {
							s += 'T';
							s += pad(d.getUTCHours());
							s += pad(d.getUTCMinutes());
							s += pad(d.getUTCSeconds());
							if (z_terminate)
								s += 'Z';
						}

						return s;
					}

					function _formatDateLine(header, d, dateonly, timezone) {
						var output = header;
						if (timezone)
							output += ";TZID=" + timezone;
						if (dateonly)
							output += ";VALUE=DATE";
						output += ":" + _formatDate(d, dateonly, !timezone) + "\n";
						return output;
					}

					function _escape(str) {
						return str.replace(/[\\;,]/g, function (match) {
							return '\\' + match;
						}).replace(/(?:\r\n|\r|\n)/g, '\\n');
					}

					function _getUID(e) {
						return e.uid + '@' + cal.domain;
					}

					// VCALENDAR and VERSION
					g = 'BEGIN:VCALENDAR\nVERSION:2.0\n';

					// PRODID
					g += 'PRODID:-' + cal.prodid + '\n';

					// NAME
					if(cal.name) {
						g += 'X-WR-CALNAME:' + cal.name + '\n';
					}
					
					if(cal.tz) {
						g += 'X-WR-TIMEZONE:' + cal.tz + '\n';
					}

					if(cal.ttl) {
						g += 'X-PUBLISHED-TTL:' + cal.ttl + '\n';
					}

					// Domain
					if(!cal.domain) {
						cal.domain = require('os').hostname() || 'localhost';
					}

					// Events
					cal.events.forEach(function(e) {
						g += 'BEGIN:VEVENT\n';
						g += 'UID:' + _getUID(e) + '\n';
						if (e.stamp)
							g += 'DTSTAMP:' + _formatDate(e.stamp) + '\n';

						g += _formatDateLine("DTSTART", e.start, e.allDay, e.tz);
						if (e.end)
							g += _formatDateLine("DTEND", e.end, e.allDay, e.tz);

						if(e.repeating) {
							var rrlue = 'RRULE:FREQ=' + e.repeating.freq;

							if(e.repeating.count) {
								rrlue += ';COUNT=' + e.repeating.count;
							}

							if(e.repeating.interval) {
								rrlue += ';INTERVAL=' + e.repeating.interval;
							}

							if(e.repeating.until) {
								rrlue += ';UNTIL=' + _formatDate(e.repeating.until);
							}

							g += rrlue + '\n';
						}

						g += 'SUMMARY:' + _escape(e.summary) + '\n';
						if(e.location) {
							g += 'LOCATION:' + _escape(e.location) + '\n';
						}
						if(e.description) {
							g += 'DESCRIPTION:' + _escape(e.description )+ '\n';
						}
						if(e.organizer) {
							g += 'ORGANIZER;CN="' + e.organizer.name.replace(/\"/g, '\\"') + '":mailto:' + e.organizer.email + '\n';
						}
						if(e.url) {
							g += 'URL;VALUE=URI:' + e.url + '\n';
						}
						if(e.method) {
							g += 'METHOD:' + e.method.toUpperCase() + '\n';
						}
						if(e.status) {
							g += 'STATUS:' + e.status.toUpperCase() + '\n';
						}

						g += 'END:VEVENT\n\n';
					});

					g += 'END:VCALENDAR';
					cal.generated = g;

					return cal.methods;
				},
				save: function(path, cb) {
					if(!cal.generated) {
						cal.methods.generate();
					}
					require('fs').writeFile(path, cal.generated, cb);
					return cal.methods;
				},
				saveSync: function(path) {
					if(!cal.generated) {
						cal.methods.generate();
					}

					/*jslint stupid: true */
					return require('fs').writeFileSync(path, cal.generated);
				},
				serve: function(res) {
					if(!cal.generated) {
						cal.methods.generate();
					}

					res.writeHead(200, {
						'Content-Type': 'text/calendar',
						'Content-Disposition': 'attachment; filename="calendar.ics"'
					});
					res.end(cal.generated);
					return cal.methods;
				},
				toString: function() {
					if(!cal.generated) {
						cal.methods.generate();
					}
					return cal.generated;
				},
				length: function() {
					return cal.events.length;
				},
				clear: function() {
					cal.events = [];
					cal.generated = null;
					return cal.methods;
				}
			}
		};

		return cal.methods;
	}
};

module.exports = a.newCalendar;
