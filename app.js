const http = require("http");
const path = require("path");
const methods = require("methods");
const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const cors = require("cors");
const passport = require("passport");
const errorhandler = require("errorhandler");

const errorrHander = require("errorhandler");
const mongoose = require("mongoose");

const isProduction = process.env.NODE_ENV === "production";
console.log(isProduction);

const app = express();

app.use(cors);

app.use(require("morgan")("dev"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(require("method-override")());
app.use(express.static(__dirname + "/public"));

app.use(
  session({
    secret: "conduit",
    cookie: { maxAge: 60000 },
    resave: false,
    saveUninitialized: false,
  })
);

if (!isProduction) {
  app.use(errorrHander());
}

if (isProduction) {
  mongoose.connect(process.env.MONGODB_URI);
} else {
  mongoose.connect("mongodb://localhost/toiviet");
  mongoose.set("debug", true);
}

app.use(function (req, res, next) {
  const err = new Error("Not Found");
  err.status = 404;
  next(err);
});


require('./models/User')

/// error handlers

// development error handler
// will print stacktrace

if (!isProduction) {
  app.use(function (err, req, res, next) {
    console.log(err.stack);
    res.status(err.status || 500);
    res.json({
      errors: {
        message: err.message,
        error: err,
      },
    });
  });
}

app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.json({'errors': {
    message: err.message,
    error: {}
  }});
});


const server = app.listen(process.env.PORT || 5000, function() {
  console.log('Listening on port ' + server.address().port)
})