var Sequelize = require('sequelize');
var debug = require('debug')('echo:models');

var dbpath = process.env.DBPATH || 'db.sqlite';

var db = new Sequelize('', '', '', {
	dialect: 'sqlite',
	storage: dbpath,
	logging: debug
});

exports = module.exports = {
	db: db,

	Event: require('./models/event')(db),
	User: require('./models/user')(db),
	Post: require('./models/post')(db),
	Feed: require('./models/feed')(db),
	Location: require('./models/location')(db),
	Stats: require('./models/stats')(db)
};

exports.Location.hasMany(exports.Event);
exports.Event.belongsTo(exports.Location);

exports.Feed.hasMany(exports.Post);
exports.Post.belongsTo(exports.Feed);
