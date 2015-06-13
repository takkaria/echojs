var Promise = require('promise');

module.exports = {

	mockPromise: function mockPromise(yield_fn) {
		return function() {
			return new Promise(function (resolve, reject) {
				resolve(yield_fn());
			});
		};
	}

};
