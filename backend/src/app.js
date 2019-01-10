"use strict";

let express = require('express');
let path = require('path');
let logger = require('morgan');
let cookieParser = require('cookie-parser');
let bodyParser = require('body-parser');
let helmet = require('helmet');
//require node-config to store and access configuration from the file
let config = require('config');

//require module for stroing session information
const session = require('express-session');
const MongoStoreSession = require('connect-mongo')(session);


//modules and files for passwordless access
let passwordless = require('passwordless');
let MongoStore = require('passwordless-mongostore-bcrypt-nodejs-updated');


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

//require passwordless controller for email sending
//DO NOT DELETE - USED FOR INITIATING DEFAULT DELIVERY METHOD FOR PASSWORDLESS
let emailTockenSend = require('./controllers/PasswordlessService');

//require receivingService file for in system API
let receiver = require('./routes/receivingService');
//require receivingService file for in system API
let externalAPI_v1 = require('./routes/API_v1');

//internal API for frontend
const internal_API = require('./routes/internal_API');

//require receivingService file for checking email
let changes = require('./routes/receivingPersEmailChanger');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Passwordless middleware
app.use(passwordless.sessionSupport());
app.use(passwordless.acceptToken({ successRedirect: '/system/browse', successFlash: true}));


app.use('/api', receiver);
app.use('/v1/api', externalAPI_v1);
app.use('/changes', changes);
app.use('/internal', internal_API);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // send the error page
  res.status(err.status || 500);
  res.sendStatus(err.status);
});

module.exports = app;
