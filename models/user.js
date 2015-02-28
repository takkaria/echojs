var sequelize = require('sequelize');
var crypto = require('crypto');
var debug = require('debug')('echo:models:user');

module.exports = function(db) {

	return db.define('user', {
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
		id: { type: sequelize.INTEGER, autoIncrement: true, primaryKey: true },
		salt: {
			type: sequelize.TEXT,
			get: function() {
				var salt = this.getDataValue('salt');
				if ((salt === '')||(typeof(salt) === 'undefined')) {
					salt = crypto.randomBytes(256).toString('base64');
					this.setDataValue('salt', salt);
				}
				return salt;
			}
		},
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
				var salt = this.salt;
				var digest = crypto.createHash('sha256').update(salt + password).digest('base64');
				debug('digest: ' + digest);
				this.setDataValue('digest', digest);
			},
			checkPassword: function(password) {
				var digest = crypto.createHash('sha256').update(
					this.salt + password
				).digest('base64');
				return digest === this.getDataValue('digest');
			},
			resetPassword: function() {
				var token = crypto.createHash('sha256')
					.update(crypto.pseudoRandomBytes(24))
					.digest('base64');
				this.setDataValue('pwreset', token);
			}
		}
	});

}
