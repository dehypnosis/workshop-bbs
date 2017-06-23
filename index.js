const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const config = require('./config');
const path = require('path');

// HTTP Server
const app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
const port = process.env.PORT || 3000;
app.listen(port, () => console.log('Listen to ', port));

// helper
app.locals.util = require('./util');

// Middlewares
// static files
app.use('/assets', express.static(path.join(__dirname, 'static')));

// session
const MySQLStore = require('express-mysql-session')(session);
const sessionStore = new MySQLStore(config.mysql);
app.use(session({
  secret: config.secret,
  store: sessionStore,
  resave: false,
  saveUninitialized: true,
}));

// body parser
app.use(bodyParser.urlencoded({extended:true}));

// templates
app.use(require('./middles/locals'));

// Routers
app.use('/user', require('./routers/user'));
app.use('/', require('./routers/bbs'));

// Not Found Error
app.use(require('./middles/not-found'));

// Internal Error
app.use(require('./middles/error'));
