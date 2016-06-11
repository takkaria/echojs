'use strict';

require('dotenv').load();

var express = require('express');
var session = require('express-session');
var FileStore = require('session-file-store')(session);
var flash = require('express-flash');
var path = require('path');
var compression = require('compression');
var favicon = require('serve-favicon');
var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var swig = require('swig');
var paginate = require('express-paginate');
var moment = require('moment');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var logger = require('./lib/logger');
var models = require('./models');

var routes = require('./routes/index');
var events = require('./routes/events');
var event = require('./routes/event');
var user = require('./routes/user');
var admin = require('./routes/admin');
var api = require('./routes/api');
var about = require('./routes/about');
var embed = require('./routes/embed');

var app = express();

// "global" view variables
app.locals.site = process.env.HOST + (
	typeof process.env.PORT === 'undefined' ?
		'' :
		process.env.PORT
);
app.locals.statichost = process.env.STATIC_HOST || '';

// Set up calendar to not include times.
// models/event.js depends on this.
// See: http://momentjs.com/docs/#/customization/calendar/
moment.locale('en', {
	calendar: {
		lastWeek: '[last] dddd',
		lastDay:  '[Yesterday]',
		sameDay:  '[Today]',
		nextDay:  '[Tomorrow]',
		nextWeek: 'dddd',
		sameElse: 'ddd D MMM'
	}
});

// view engine setup
app.engine('html', swig.renderFile);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');

if (process.env.NODE_ENV === 'development')
	swig.setDefaults({ cache: false });

var applyFilters = require('./lib/swig-filters');
applyFilters(swig);

var remarkableSwig = require('swig-remarkable');
remarkableSwig.useFilter(swig);
remarkableSwig.useTag(swig);

// Notifications
require('./lib/notify-email')
require('./lib/notify-twitter')

// HTTP protocol setup
app.use(compression());
app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(session({
	secret: 'half-baked potato claustrophobia',
	resave: false,
	saveUninitialized: false,
	store: new FileStore(),
	proxy: true // if you do SSL outside of node
}));

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(paginate.middleware());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/bower_components', express.static(path.join(__dirname, 'bower_components')));

// routes
app.use('/', routes);
app.use('/event', event);
app.use('/events', events);
app.use('/user', user);
app.use('/admin', admin);
app.use('/api', api);
app.use('/about', about);
app.use('/embed', embed);

// Permanently redirect the old PHP icalendar URL to the new one
app.use('/icalendar', function(req, res) {
	res.redirect(301, '/api/ical');
});

app.use(function(req, res, next) {
	res.status(404);

	logger.log('warn', '404 %s', req.url);
	return res.render('404');
});

// Error handler
app.use(function(err, req, res, next) {
	let developmentEnv = (process.env.NODE_ENV === 'development');

	if (!res.headersSent) {
		res.status(500);
	}

	logger.log('error', '%s %s', req.url, err.message, err);

	// Only show stackstrace in dev environment
	if (developmentEnv) {
		res.render('error', {
			error: err
		});
	} else {
		res.render('error')
	}
});


passport.use(new LocalStrategy({
		usernameField: 'email',
	},
	function(email, password, done) {
		var user_;
		models.User.find({
			where: [
				{ email: email },
			]
		}).then(function(user) {
			user_ = user;

			if (!user) {
				return done(null, false, { message: 'Incorrect email.' });
			}

			return user.checkPassword(password);
		}).then(function(correct) {
			if (correct === false) {
				return done(null, false, { message: 'Incorrect password.' });
			}

			return done(null, user_);
		});
	}
));

passport.serializeUser(function(user, done) {
	done(null, user.email);
});

passport.deserializeUser(function(email, done) {
	models.User.find({
		where: [
			{ email: email },
		]
	}).then(function(user) {
		done(null, user);
	});
});

module.exports = app;
