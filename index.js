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

// Middlewares
app.use('/assets', express.static(path.join(__dirname, 'static')));
app.use(session({
  secret: config.secret,
  resave: false,
  saveUninitialized: true,
}));
app.use(bodyParser.urlencoded({extended:true}));
app.use(require('./middles/locals'));

// Routers
app.use('/', require('./routers/bbs'));
app.use('/user', require('./routers/user'));

// Not Found Error
app.use(require('./middles/not-found'));

// Internal Error
app.use(require('./middles/error'));
