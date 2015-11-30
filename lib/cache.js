var cacheManager = require('cache-manager');
var memoryCache = cacheManager.caching({
	store: 'memory',
	max: 100,
	ttl: 25 // seconds
});

module.exports = memoryCache;

module.exports.isCacheFriendly =
	(req) => !req.isAuthenticated() || req.session.flash.length === 0;

// At some point expand outwards from using memory caching and use
// https://github.com/hotelde/node-cache-manager-fs
