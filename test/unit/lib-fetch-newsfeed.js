'use strict';

const expect = require('chai').expect;
const fetchNewsfeed = require('../../lib/fetch-newsfeed');

const nock = require('nock');
nock.disableNetConnect();

// Constants
const FEED_URL = 'http://example.net/feed';

// Utility functions
function fakeServer(filename, headers) {
	return nock('http://example.net')
			.get('/feed')
			.replyWithFile(200,
					__dirname + '/feed-data/' + filename,
					headers);
}

// Tests
describe('fetch-newsfeed', function() {
	it('should make an HTTP request', function(done) {
		let serverRequest = fakeServer('feed001.rss');

		fetchNewsfeed(FEED_URL, function() {
			expect(serverRequest.isDone()).to.equal(true);
			done();
		})
	})

	describe('when fetching cal001.ics', function() {
		it('should return an array with two posts', function(done) {
			let serverRequest = fakeServer('feed001.rss');

			fetchNewsfeed(FEED_URL, function(err, posts) {
				expect(err).to.not.exist;
				expect(serverRequest.isDone()).to.equal(true);
				expect(posts).to.not.equal(null);
				expect(Array.isArray(posts)).to.equal(true);
				expect(posts.length).to.equal(3);

				console.log(posts);

				done();
			})
		})
	})
})
