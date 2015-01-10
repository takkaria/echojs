var express = require('express');
var session = require('express-session');
var flash = require('express-flash');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var swig = require('swig');
var passport = require('passport');

var models = require('./models');

var routes = require('./routes/index');
var events = require('./routes/events');
var event = require('./routes/event');
var user = require('./routes/user');
var admin = require('./routes/admin');
var api = require('./routes/api');

var app = express();

// view engine setup
app.engine('html', swig.renderFile);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');

app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/bower_components', express.static(path.join(__dirname, 'bower_components')));

app.use('/', routes);
app.use('/event', event);
app.use('/events', events);
app.use('/user', user);
app.use('/admin', admin);
app.use('/api', api);

app.set('models', models(false));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

var passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy;

passport.use(new LocalStrategy({
        usernameField: 'email',
    },
    function(email, password, done) {
    var models = app.get('models');
    var sequelize = models.sequelize;

    models.User.find({
        where: [
            { email: email },
        ]
    }).then(function(user) {
        if (!user) {
            return done(null, false, { message: 'Incorrect email.' });
        }
        if (!user.checkPassword(password)) {
            return done(null, false, { message: 'Incorrect password.' });
        }
        return done(null, user);
    });
}));

passport.serializeUser(function(user, done) {
  done(null, user.email);
});

passport.deserializeUser(function(email, done) {
    var models = app.get('models');
    models.User.find({
        where: [
            { email: email },
        ]
    }).then(function(user) {
    done(null, user);
  });
});

module.exports = app;
