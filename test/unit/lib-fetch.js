var expect = require('chai').expect;
var fetch = require('../../lib/fetch');
var models = require('models');
var Event = models.Event;

describe('fetch', function() {
	describe('#iCalDataToEvent', function() {
		// XXX add start and end

		var entry = {
			summary: 'summary',
			location: 'location',
			description: 'description',
			url: 'url',
			uid: 'tag:unique-uid'
		};

		it('should correctly fill in fields', function() {
			var evt = fetch._iCalDataToEvent(entry);

			expect(evt.title).to.equal(entry.summary);
			expect(evt.location_text).to.equal(entry.location);
			expect(evt.blurb).to.equal(entry.description);
			expect(evt.url.toString()).to.equal(entry.url);
			expect(evt.importid).to.equal(entry.uid);
		});
	});

	describe('#processICalEntry', function() {
		var originalSave;

		before(function() {
			// Avoid actually saving anything
			originalSave = Event.Instance.prototype.save;
			Event.Instance.prototype.save = function() {
				var self = this;
				return new Promise(function(resolve, reject) {
					resolve(self);
				});
			};
		});

		after(function() {
			Event.Instance.prototype.save = originalSave;
		});

		it('should not throw an error when asked to save an event', function() {
			var data = {
				summary: 'TEST',
				start: new Date('Wed, 04 Mar 2015 18:00:00 GMT'),
				end: new Date('Wed, 04 Mar 2015 20:00:00 GMT'),
				location: 'Chester Street, Manchester, Greater Manchester, M1 5GD, United Kingdom',
				description: 'Rania Masri will speak on the topic ‘Dismantling Racism and Colonialism',
				url: 'http://www.psc-manchester.org.uk/event/tom-hurndall-tenth-memorial-lecture-speaker-rania-masri/',
				uid: '1033-1425492000-1425499200@http://www.istandbyyou.org.uk',
			};

			return fetch._processICalEntry(data);
		});
	});
});
