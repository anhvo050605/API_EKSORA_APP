var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
require('dotenv').config();


const mongoose = require('mongoose');
require("./schema/userSchema");

const authRoutes = require('./routes/authRoutes'); 
const userRoutes = require('./routes/userRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const tourRoutes = require('./routes/tourRoutes');



//============================================================================================================
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//mongodb://127.0.0.1:27017/
// mongodb+srv://anhvo050605a:voanh050605@cluster0.4orqa.mongodb.net/
mongoose.connect('mongodb://127.0.0.1:27017/API_EKSORA')
  .then(() => console.log('>>>>>>>>>> DB Connected!!!!!!'))
  .catch(err => console.log('>>>>>>>>> DB Error: ', err));
//===================================================================================================
app.use('/api', authRoutes);

app.use('/api', userRoutes);

app.use('/api/categories', categoryRoutes);

app.use('/api', tourRoutes);








//===================================================================================================


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
//mongodb://127.0.0.1:27017
