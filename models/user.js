'use strict';

const denodeify = require('es6-denodeify')();
const sequelize = require('sequelize');
const crypto = require('crypto');
const debug = require('debug')('echo:models:user');
const bcrypt = require('bcrypt');

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
						where: { email: value },
						attributes: [ 'id' ]
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
		twitter: { type: sequelize.TEXT },
		notify: { type: sequelize.TEXT },
		rights: {
			type: sequelize.ENUM,
			values: [ 'admin', 'editor' ],
			allowNull: false
		}
	}, {
		timestamps: false,
		createdAt: false,
		underscored: true,
		instanceMethods: {
			setPassword: function(password) {
				const bcryptHash = denodeify(bcrypt.hash);

				return bcryptHash(password, process.env.BCRYPT_FACTOR || 10)
					.then(hash => {
						this.setDataValue('digest', hash);
						this.setDataValue('salt', 'bcrypt');
						return this;
					});
			},

			checkPassword: function(password) {
				const bcryptCheck = denodeify(bcrypt.compare);
				return bcryptCheck(password, this.getDataValue('digest'));
			},

			resetPassword: function() {
				var token = crypto.createHash('sha256')
					.update(crypto.pseudoRandomBytes(24))
					.digest('base64');
				this.setDataValue('pwreset', token);
				return this;
			}
		}
	});

};
