var express = require("express");
var router = express.Router();
var passport = require("../lib/passport");
var crypto = require("crypto");

var UserHandler = require("../handlers/user_handler");
var DragoHandler = require("../handlers/drago_handler");
var Drago = DragoHandler.model;
var CollectionHandler = require("../handlers/collection_handler");
var Collection = CollectionHandler.model;

var tips_hists = require("../../config/tips_hists");
var TIPS = tips_hists.tips;
var HINTS = tips_hists.hints;
var Errors = require("../lib/errors");

var fallback = function(req, res, next){
  if(!req.user)
    res.redirect("/start");
  else{
    res.locals.alerts = req.flash("alerts") || [];
    res.locals.user = req.user;
    res.locals.tip = TIPS[Math.floor(Math.random() * TIPS.length)];
    res.locals.hints = HINTS;
    next();
  }
};

function findDrago(req, res, next){
  Drago.findOne({ name: req.params.name, "users.user": { $in: [req.user.id] } }, function(err, drago){
    if(err){
      next(err);
    } else if(!drago) {
      res.locals.alert = {
        type: "danger",
        message: "Your are not authenticate to access this drago!"
      }
      res.redirect("/");
    } else {
      req.drago = drago;
      Collection.find({drago: req.drago._id}, function(err, collections){
        if(err)
          return next(err);
        else{
          req.collections = collections;
          next();
        }
      });
    }
  });
};

router.get("/start", function(req, res, next){
  res.render("start");
});

var passport_authenticate = passport.authenticate("local", { successRedirect: "/", failureRedirect: "/start", failureFlash: true });
router.post("/start", function(req, res, next){
  var type = req.body.loginType;
  var password = req.body.password;
  if(type === "login"){
    passport_authenticate(req, res, next);
  } else {
    res.render("start", { data: req.body, next: true });
  }
});

router.post("/register", function(req, res, next){
  UserHandler.create(req.body, function(err, user){
    if(err)
      return next(err);
    else{
      req.login(user, function(err) {
        if (err) { 
          return next(err);
        }
        return res.redirect("/");
      });
    }
  });
});

router.get("/", fallback, function(req, res, next){
  Drago.find({ "users.user": { $in: [req.user.id] }}, function(err, dragos){
    if(err)
      return next(err);
    else
      res.render("main", { user: req.user, dragos: dragos });
  });
});

router.post("/dragos", fallback, function(req, res, next){
  var data = {};
  data.users = [{
    user: req.user.id,
    type: "owner"
  }];
  data.name = req.body.name;
  data.description = req.body.description;

  if(req.body.gcmkey)
    data.gcmkeys = [req.body.gcmkey];
  else
    data.gcmkeys = [];
  
  if(req.body.dragoID) {
    DragoHandler.update(req.body.dragoID, {name: data.name, description: data.description, gcmkeys: data.gcmkeys }, function(err, drago){
      if(err)
        next(err);
      else
        res.redirect("/dragos/"+drago.name);
    });
  } else {
    DragoHandler.create(data, function(err, drago){
      if(err)
        next(err);
      else
        res.redirect("/dragos/"+drago.name);
    });  
  }
});

router.get("/dragos/:name", fallback, findDrago, function(req, res, next){
  Drago.find({ "users.user": { $in: [req.user.id] }}, function(err, dragos){
    if(err)
      return next(err);
    else
      Collection.find({drago: req.drago._id}, function(err, collections){
        if(err)
          return next(err);
        else
          res.render("main", { user: req.user, dragos: dragos, target: req.drago, collections: collections });
      });
  });
});

router["delete"]("/dragos/:name", fallback, findDrago, function(req, res, next){
  Drago.findById(req.drago._id, function(err, drago){
    if(err) {
      return next(err);
    } else {
      Collection.remove({drago: drago._id}, function(err){
        if(err){
          return next(err);
        } else {
          drago.remove(function(err){
            if(err)
              return next(err);
            else
              res.redirect("/");
          });
        }
      });
    }
  });
});

router.post("/dragos/:name/collections", fallback, findDrago, function(req, res, next){
  var data = {};

  data.name = req.body.name;
  data.drago = req.drago._id.toString();

  CollectionHandler.create(data, function(err, collection){
    if(err)
      return next(err);
    else
      res.redirect("/dragos/" + req.drago.name + "/collections/" + collection.name);
  });
});

router.post("/dragos/:name/token", fallback, findDrago, function(req, res, next){
  var data = {
    name: req.body.name,
    token: crypto.randomBytes(32).toString("hex"),
    readBlock: [],
    writeBlock: []
  };
  var _collections, _read = [], _write = [];
  var update;

  if(req.body.collections && !req.body.collections.length)
    _collections = [req.body.collections];
  else if(req.body.collections)
    _collections = req.body.collections;
  if(req.body.read && !req.body.read.length)
    _read = [req.body.read];
  else if(req.body.read)
    _read = req.body.read;
  if(req.body.write && !req.body.write.length)
    _write = [req.body.write];
  else if(req.body.write)
    _write = req.body.write;

  for (var a = 0; a < _collections.length; a++) {
    if(_read.indexOf(_collections[a]) === -1)
      data.readBlock.push(_collections[a]);
    if(_write.indexOf(_collections[a]) === -1)
      data.writeBlock.push(_collections[a]);
  }

  for (var i = 0; i < req.drago.access_token.length; i++) {
    if(req.drago.access_token[i].token === req.body.token){
      update = { token: req.body.token };
      var _data = {}
      _data["access_token." + i + ".readBlock"] = data.readBlock;
      _data["access_token." + i + ".writeBlock"] = data.writeBlock;
      _data["access_token." + i + ".name"] = data.name;
      console.log(_data);
      data = _data;
      break;
    }
  }

  if(update){
    Drago.findByIdAndUpdate(req.drago._id, { $set: data }, function(err, drago){
      if(err)
        return next(err);
      else
        res.redirect("/dragos/" + req.params.name);
    });
  } else {
    Drago.findByIdAndUpdate(req.drago._id, { $push: {"access_token": data } }, function(err, drago){
      if(err)
        return next(err);
      else
        res.redirect("/dragos/" + req.params.name);
    });
  }  
});

router["delete"]("/dragos/:name/token", fallback, findDrago, function(req, res, next) {
  var _token = req.body.token;
  Drago.findOneAndUpdate({"access_token.token": _token, "access_token.type": { $ne: "autogenerate"}}, { $pull: { access_token: { token: _token } } }, function(err, drago) {
    if(err) {
      res.send({error: err});
    } else {
      console.log(drago);
      res.send(drago);
    }
  });
});

router.get("/dragos/:name/collections/:collection_name", fallback, findDrago, function(req, res, next){
  Collection.findOne({ name: req.params.collection_name, drago: req.drago._id }, function(err, collection){
    if(err)
      return next(err);
    else
      res.render("collection", { drago: req.drago, collection: collection });
  });
});

router["delete"]("/dragos/:name/collections/:collection_name", fallback, findDrago, function(req, res, next){
  CollectionHandler.remove({name: req.params.collection_name}, function(err){
    if(err)
      return next(err);
    else
      res.redirect("/dragos/" + req.drago.name);
  });
});

router.post("/dragos/:name/collections/:collection_name/updateschema", fallback, findDrago, function(req, res, next){
  var schema = JSON.parse(req.body.schema);

  CollectionHandler.update( {drago: req.drago._id, name: req.params.collection_name },{savedSchema: schema}, function(err, schema){
    if(err)
      return next(err);
    else
      res.redirect("/dragos/" + req.drago.name + "/collections/" + req.params.collection_name + "#add");
  });
});

router.use(function(req, res, next) {
  var err = new Errors.NotFound();
  res.render("error", { message: err.message, error: err});
});

router.use(function(err, req, res, next){
  var alerts = [];
  if(err.name === "ValidationError") {
    if(err.errors) {
      for(var error in err.errors){
        alerts.push({
          type: "danger",
          title: err.errors[error].name,
          message: err.errors[error].message
        });
      }
    } else if (err.error){
      alerts.push({
        type: "danger",
        message: err.error.message
      });
    }
  }
  if(alerts.length > 0){
    req.flash("alerts", alerts);
    res.redirect(req.onErrorRedirect || "/");
  }else{
    next(err);
  }
});

module.exports = router;