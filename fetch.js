var models = require('./models');
var Event = models.Event,
	Post = models.Post,
	Feed = models.Feed;

var ical = require('ical');
var FeedParser = require('feedparser');
var request = require('request');
var htmlStrip = require('htmlstrip-native').html_strip
var debug = require('debug')('echo:fetch');

// = iCal ===================================================== //

function saveEvent(item, error, done) {
	debug("Adding new event: " + item.summary);

	Event
		.build({
			title: item.summary.trim(),
			startdt: item.start,
			enddt: item.end,
			location: item.location,
			blurb: item.description.trim(),
			url: item.url,
			state: 'imported',
			importid: item.uid
		})
		.save({ validate: false })
		.then(done)
		.catch(function (e) {
			error(e);
		});
}

function fetchICal(params, error) {
	var url = params.url;
	var filter = params.filter;
	var transform = params.transform;

	debug("Fetching iCal " + url);

	ical.fromURL(url, {}, function(err, data) {
		for (var k in data) {

			if (!data.hasOwnProperty(k)) continue;
			if (!data[k].start || data[k].start < new Date()) continue;
			if (filter && filter(data[k])) continue;

			var item = data[k]; // bind locally

			function save(event) {
				if (event != null) return;   /* Don't duplicate IDs */
				if (transform) transform(this);

				saveEvent(this, error);
			}

			Event
				.find({ where: { importid: data[k].uid } })
				.then(save.bind(data[k]))
				.on('error', error);
		}
	});
}


// = Atom/RSS ================================================= //

// 'Safe' exec - returns an array no matter what, so you can index into it
RegExp.prototype.sexec = function(str) {
	return this.exec(str) || [ ];
};

function monthToInt(s) {
	var first3 = s.slice(0, 3).toLowerCase();
	var a = {
		jan: 1,  feb: 2,  mar: 3,  apr: 4,
		may: 5,  jun: 6,  jul: 7,  aug: 8,
		sep: 9,  oct: 10, nov: 11, dec: 12
	};

	return a[first3] || null;
}

function findDate(base, text) {

	var time = /\d?\d[\.:]\d\d([ap]m)?/.sexec(text)[0] ||
			/\d?\d([ap]m)/.sexec(text)[0];

	var day = /(\d?\d)(th|rd|nd)/.sexec(text)[1];

	var month = /(January|February|March|May|April|June|July|August|September|October|November|December)/.sexec(text)[0] ||
			/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/.sexec(text)[0];

	if (time && day && month) {
		var d = new Date();

		// Months in JS are 0-11, not 1-12
		d.setMonth(monthToInt(month) - 1);

		// Assume year in the future
		if (d.getMonth() < base.getMonth())
			d.setYear(base.getFullYear() + 1);
		else
			d.setYear(base.getFullYear());

		// 'day' is in form 23rd, parseInt will just look at numbers
		d.setDate(parseInt(day));

		var hours = parseInt(time);

		if (!/(am|pm)/.test(time)) {
			if (hours > 0 || hours <= 6)
				hours += 12;
		} else if (/pm/.test(time)) {
			hours += 12;
		}

		var minutes = parseInt(/[\.:](\d\d)/.sexec(time)[1]) || 0;

		d.setHours(hours, minutes, 0, 0);

		return d;
	}

	return null;
}

function addPost(data, error) {
	// https://github.com/danmactough/node-feedparser#what-is-the-parsed-output-produced-by-feedparser
	// may want to re-add summary, content or image parsing at some point

	debug("Adding new post: " + data.title);

	// Build the post
	Post.build({
			id: data.guid,
			title: data.title,
			link: data.link,
			date: data.pubDate,
			feed_id: data.meta.xmlurl,
		})
		.save()
		.on('error', error);

	// Check if it's like an event
	var date = findDate(data.pubDate, data.description);
	if (!date) return;

	var now = new Date();
	if (date.getTime() < now.getTime() ||
			date.getTime() > (now.getTime() + 7.88923e9)) // 1.578e10 == 3 months in ms
		return;

	Event.find({ where: { importid: data.guid } })
		 .then(function(evt) {
			if (evt != null) return;  // don't import twice

			debug("Adding new event: " + data.title);

			Event.build({
					title: data.title,
					startdt: date,
					url: data.link,
					blurb: htmlStrip(data.description, {
						include_script: false,
						include_style: false,
					}),
					state: 'imported',
					importid: data.guid
				})
				.save({ validate: false })
				.on('error', error);
		 });
}

function fetchFeed(params) {
	var url = params.url;
	var onerror = params.error;

	var req = request(url)
	  , feedparser = new FeedParser();

	// Set error handlers
	req.on('error', onerror);
	feedparser.on('error', onerror);

	req.on('response', function (res) {
		var stream = this;
		if (res.statusCode != 200) return this.emit('error', new Error('Bad status code'));

		stream.pipe(feedparser);
	});

	debug("Fetching feed " + url);

	feedparser.on('readable', function() {
		// This is where the action is!
		var stream = this;
		var data;

		while (data = stream.read()) {
			var item = data;	// bind locally
			item.meta.xmlurl = url;	// this doesn't always get saved by the parser

			if (!item.title) return;	// Ignore some items

			if (!item.guid)
				throw new Error("Feed item with no ID");

			Post.find({ where: { id: item.guid } })
				.then(function(post) {
					if (post != null) return;	// Don't duplicate posts
					addPost(item, onerror);
				});
		}
	});
}


// = Exports ================================================== //

module.exports = {
	ical: fetchICal,
	feed: fetchFeed,
	findDate: findDate,
	saveEvent: saveEvent
}
