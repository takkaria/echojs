var winston = require('winston');
var mkdirp = require('mkdirp');

// Init log path
if (!process.env.LOGPATH) {
    process.env.LOGPATH = './logs';
}
mkdirp(process.env.LOGPATH);

// Init Winston file logging
module.exports = new winston.Logger({
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({
            filename: process.env.logpath + '/all.log'
        }),
    ],
    exceptionHandlers: [
        new winston.transports.File({
            filename: process.env.logpath + '/exceptions.log',
        })
    ]
})
