var sequelize = require('sequelize');
var crypto = require('crypto');
var debug = require('debug')('echo:models:user');
var bcrypt = require('bcrypt');
var Promise = require('promise');

module.exports = function(db) {

	return db.define('user', {
		id: { type: sequelize.INTEGER, autoIncrement: true, primaryKey: true },

		email: {
			type: sequelize.TEXT,
			allowNull: false,
			validate:  {
				isEmail: true,
				isUnique: function(value, next) {
					var id = this.getDataValue('id');

					exports.User.find({
						where: {email: value},
						attributes: ['id']
					}).then(function(user) {
						if (user && user.id !== id)
							return next('email already in use');
						next();
					}).catch(function(err) {
						return next(err);
					});
				}
			}
		},

		salt: { type: sequelize.TEXT },
		digest: { type: sequelize.TEXT },

		pwreset: { type: sequelize.TEXT },
		notify: { type: sequelize.BOOLEAN },
		rights: {
			type: sequelize.ENUM,
			values: [ "admin", "editor" ],
			allowNull: false
		}
	}, {
		timestamps: false,
		createdAt: false,
		underscored: true,
		instanceMethods: {
			setPassword: function(password) {
				var self = this;
				return new Promise(function(resolve, reject) {
					bcrypt.hash(password, process.env.BCRYPT_FACTOR || 10, function(err, hash) {
						if (err) {
							reject(err);
						} else {
							self.setDataValue('digest', hash);
							self.setDataValue('salt', 'bcrypt');
							resolve(hash);
						}
					});
				});
			},
			checkPassword: function(password) {
				var self = this;
				return new Promise(function(resolve, reject) {
					if (self.salt == 'bcrypt') {
						bcrypt.compare(password, self.getDataValue('digest'), function(err, res) {
							debug("Password checked - result " + res);
							if (err) reject(err);
							else resolve(res);
						});
					} else {
						var digest = crypto.createHash('sha256').update(
							self.salt + password
						).digest('base64');
						debug("Old sha256 password checked");
						resolve(digest === self.getDataValue('digest'));
					}
				});
			},
			resetPassword: function() {
				var token = crypto.createHash('sha256')
					.update(crypto.pseudoRandomBytes(24))
					.digest('base64');
				this.setDataValue('pwreset', token);
			}
		}
	});

};
