"use strict";

let express = require('express');
let path = require('path');
let favicon = require('serve-favicon');
let logger = require('morgan');
let cookieParser = require('cookie-parser');
let bodyParser = require('body-parser');
let helmet = require('helmet');
//require node-config to store and access configuration from the file
let config = require('config');
let BACKEND_ADDRESS = config.get('Environment.backend_host');

//require module for stroing session information
const session = require('express-session');
const MongoStoreSession = require('connect-mongo')(session);

//in memory cache
const cache = require('memory-cache-ttl');
cache.flush();
cache.init({ ttl: 2768400, interval: 60, randomize: false });
cache.set('cache', 'false');

//modules and files for passwordless access
let passwordless = require('passwordless');
let MongoStore = require('passwordless-mongostore-bcrypt-nodejs-updated');

let index = require('./routes/index');
const email = require('./routes/email');
const about = require('./routes/about');
const cookie = require('./routes/cookie');
const research = require('./routes/research');
const terms = require('./routes/terms');
const privacy = require('./routes/privacy');
const feedback = require('./routes/feedback');
const system = require('./routes/system');
//const internal_API = require('./routes/internal_API');

let app = express();
app.enable('trust proxy');
app.use(helmet());



//require flash middleware
let flash = require('connect-flash');

// MongoDB TokenStore for passwordless. establishing connection to a mongoDB
//TODO auth usage of the mongoDB with user and pass (should be in the link in config.file)

let pathToMongoDb = config.get('Connector.mongo_db.mongo_passwordless');
let host = config.get('Passwordless.host');
passwordless.init(new MongoStore(pathToMongoDb), {
    server: {
        auto_reconnect: true
    },
    mongostore: {
        collection: 'token'
    }
});

//Establishing connection to MongoDB for storing sessions and setting session
//TODO auth usage of the mongoDB with user and pass (should be in the link in config.file)

//session initialization based on NODE_ENV
let sess = {
  secret: config.get('Session.secret'),
  resave: false,
  rolling: true,
  name: config.get('Session.name'),
  saveUninitialized: true, //saved in persistend DB
  maxAge: config.get('Session.maxAge'), //max life of cookie in milliseconds
  store: new MongoStoreSession({
    url: config.get('Connector.mongo_db.mongo_session'),
    ttl: config.get('Session.ttl') // = 30 minutes (in seconds)
  }),
  cookie: {
    httpOnly: true,
    //domain: 'ninetofive.work',
    sameSite: 'lax',
    maxAge: config.get('Session.maxAge')
  }
};


if (config.get('Environment.type') === 'production'){
  console.log('Working in production mode');

  sess.cookie.secure = true;
  sess.cookie.domain = config.get('Session.domain');
  app.use(session(sess));

} else {
  console.log('Working in development mode');
  app.use(session(sess));
  //sess.cookie.secure = false;
  //sess.cookie.domain = 'localhost'
}

//flash-messages
app.use(flash());

//trust proxy
//app.set('trust proxy', 1);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
//not sure if this is good. DISABLE VIEW CACHING


// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Passwordless middleware
app.use(passwordless.sessionSupport());
app.use(passwordless.acceptToken({ successRedirect: '/system/browse', successFlash: true}));

//Initializing Internal_API middleware




app.use('/', index);
app.use('/email', email);
app.use('/about', about);
app.use('/feedback', feedback);
app.use('/system', system);


//policies
app.use('/cookie', cookie);
app.use('/research', research);
app.use('/terms', terms);
app.use('/privacy', privacy);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  let err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
