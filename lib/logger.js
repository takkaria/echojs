var winston = require('winston');
var mkdirp = require('mkdirp');

// Init log path
if (!process.env.LOG_PATH) {
    process.env.LOG_PATH = './logs';
}
mkdirp(process.env.LOG_PATH);

// Init Winston file logging
module.exports = new winston.Logger({
    transports: [
        new winston.transports.Console({
            prettyPrint: true
        }),
        new winston.transports.File({
            filename: process.env.LOG_PATH + '/all.log'
        }),
    ],
    exceptionHandlers: [
        new winston.transports.Console({
            prettyPrint: true
        }),
        new winston.transports.File({
            filename: process.env.LOG_PATH + '/exceptions.log',
        })
    ]
});

if (process.env.LOGGLY_TOKEN) {
    require('winston-loggly');

    module.exports.add(winston.transports.Loggly, {
        token: process.env.LOGGLY_TOKEN,
        subdomain: process.env.LOGGLY_DOMAIN,
        handleExceptions: true,
        humanReadableUnhandledException: true,
        json: true
    });
}
