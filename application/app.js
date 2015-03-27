var express = require("express");
var path = require("path");
var favicon = require("serve-favicon");
var logger = require("morgan");
var session = require("express-session");
var cookieParser = require("cookie-parser");
var flash = require('connect-flash'); 
var bodyParser = require("body-parser");
var colors = require("colors");
var Errors = require("./lib/errors");
var mongoose = require("mongoose");

var vhost = require("vhost");
var db = require("../config/db");
var passport = require("./lib/passport");
var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + "/public/favicon.ico"));
app.use(logger("dev"));
app.use(function(req, res, next){
  console.log("IP" + req.ip);
  if(req.body)
    console.log("Request BDOY:\n %o".red,req.body);
  next();
});
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser("kemtalvaw"));
app.use(session({
  genid: function(req) {
    return (new mongoose.Types.ObjectId).toString();
  },
  resave: true,
  saveUninitialized: false,
  secret: "kemtalvaw",
  cookie: { maxAge: 43200000 }
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

app.use(function(req, res, next){
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "X-Requested-With, content-type");
  next();
});

app.use(require("less-middleware")(path.join(__dirname, "../public")));
app.use(express.static(path.join(__dirname, "../public")));
app.use(express.static(path.join(__dirname, "../bower_components")));

// Manipulate controllers 

app.use(vhost("kny.local", require("./controllers/home_controller")));
app.use(vhost("kny.local", require("./controllers/user_controller")));

app.use(vhost("objapi.kny.co", require("./controllers/home_controller")));
app.use(vhost("objapi.kny.co", require("./controllers/user_controller")));

/* API */
app.use(vhost("*.kny.local", require("./controllers/collection_controller")));
app.use(vhost("*.objapi.kny.co", require("./controllers/collection_controller")));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(new Errors.NotFound());
});

// error handlers

// development error handler
// will print stacktrace
if (app.get("env") === "development") {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    console.log("ERROR LOG INCOMING", err);
    console.log(err.stack);
    res.format({
      'json': function(){
        res.send({
          error: {
            message: err.message,
            error: err
          }
        });
      },
      'application/json': function(){
        res.send({
          error: {
            message: err.message,
            error: err
          }
        });
      },

      'default': function() {
        res.render( "error", {
          message: err.message,
          error: err
        });
      }
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.format({
    'json': function(){
      res.send({
        error: {
          message: err.message,
          error: {}
        }
      });
    },

    'application/json': function(){
      res.send({
        error: {
          message: err.message,
          error: {}
        }
      });
    },

    'default': function() {
      res.render( "error", {
        message: err.message,
        error: {}
      });
    }
  });
});

module.exports = app;
