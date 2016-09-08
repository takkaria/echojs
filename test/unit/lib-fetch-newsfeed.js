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

const includes = require('array-includes');
const models = require('../../models');
const Post = models.Post;
const POST_KEYS = Object.keys(Post.attributes);

function allValidKeys(evt) {
	for (let field of Object.keys(evt)) {
		if (!includes(POST_KEYS, field)) {
			console.log('Key invalid: "' + field + '"');
			return false;
		}
	}

	return true;
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
				expect(allValidKeys(posts[0])).to.equal(true);

				done();
			})
		})
	})
})
