import createError from 'http-errors'
import express from 'express'
import path from 'path'
import cookieParser from 'cookie-parser'
import logger from 'morgan'
require('dotenv').config()
import './mongodb'
import './utils/schema'
import bodyParser from 'body-parser'
const cors = require('cors');

var app = express();
var ejs = require('ejs')
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
app.engine('html', ejs.renderFile);


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
// ----------------api begin------------------  //
const routerList = require('./routes/index')
routerList.map((item) => {
  app.use('/', item);
})
// ----------------api end------------------  //

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  res.render(req.path.substring(1));
  // next(createError(404));
});
// error handler
app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  console.log('------Error begin------');
  console.log(err.status, err);
  console.log('------Error end------');
  res.status(err.status || 500);
  res.render('404.html')
});

module.exports = app;
