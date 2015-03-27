var Controller = require("./mother");
var mongoose = require("mongoose");

var Db = require('mongodb').Db;
var MongoClient = require('mongodb').MongoClient;
var Server = require('mongodb').Server;
var db = new Db("objapi-collections", new Server('localhost', 27017), {safe:false});

var Drago = require("../models/drago");

module.exports = Controller("Collection", function(Collection, UserHandler){
  
  /* Authentication and Collection Middle Ware */
  this.use(function(req, res, next){
    var access_token = req.query.access_token;
    var dragoName = req.subdomains.pop();

    if(!access_token){
      var err = new Error("Access Token Required");
      return next(err);
    }

    Drago.findOne({ name: dragoName, "access_token.token": access_token }, function(err, drago){
      if(err)
        return next(err);
      if(!drago){
        err = new Error("You are not Authenticated to access this Drago");
        err.status = 401;
        next(err);
      } else {
        req.drago = drago;
        for (var i = 0; i < drago.access_token.length; i++) {
          if(drago.access_token[i].token === access_token)
            req.access_token = drago.access_token[i];
        }
        next();
      }
    });
  });

  function authCollection(level){

    return function(req, res, next){
      var name = req.params.collection;
      var _err = new Error("Method is not allow with this token");
      _err.status = 405;
      var call = {
        calledAt: Date.now(),
        access_type: level,
        ips: req.ips,
        originalUrl: req.originalUrl
      };

      if(level === "read" && req.access_token.readBlock.indexOf(name) !== -1 ){
        return next(_err);
      }

      if(level === "write" && req.access_token.writeBlock.indexOf(name) !== -1 ){
        return next(_err);
      }

      Collection.findOneAndUpdate({ name: name, drago: req.drago._id }, { $push: { calls: call }}, function(err, collection){
        if(err)
          return next(err);
        if(!collection){
          err = new Error("You are not Authenticated to access this Collection");
          err.status = 423;
          next(err);
        } else {
          req.collection = collection;
          req.mcol = req.drago.name + "-" + collection.name;
          next();
        }
      });
    }
  }

  this["get"]("/:collection", authCollection("read"), function(req, res, next){

    var query = {};

    if(req.query.sort)
      query.sort = req.query.sort;
    if(req.query.fields)
      query.fields = req.query.fields.split(",");
    if(req.query.limit)
      query.limit = +(req.query.limit);
    if(req.query.offset)
      query.offset = +(req.query.offset);

    db.open(function(err, db) {
      // Fetch a collection to insert document into
      var collection = db.collection(req.mcol)

      // // Fetch the document
      collection.find({}, query).toArray(function(err, items){
        if(err)
          next(err);
        else
          res.jsonp({ data: items });
        
        db.close();
      });
    });
  });

  this["search"]("/:collection", authCollection("write"), function(req, res, next){
    var queryOption = {};
    var query = {};

    if(req.body.sort)
      queryOption.sort = req.body.sort;
    if(req.body.fields)
      queryOption.fields = req.body.fields.split(",");
    if(req.body.limit)
      queryOption.limit = +(req.body.limit);
    if(req.body.offset)
      queryOption.offset = +(req.body.offset);
    if(req.body.query)
      query = req.body.query;

    db.open(function(err, db) {
      // Fetch a collection to insert document into
      var collection = db.collection(req.mcol)

      // // Fetch the document
      collection.find(query, queryOption).toArray(function(err, items){
        if(err)
          next(err);
        else
          res.jsonp({ data: items });
        
        db.close();
      });
    });
  });

  this["post"]("/:collection", authCollection("write"), function(req, res, next){

    var _err;
    if(!req.get("Content-Type").match(/(application\/)*json/)){
      _err = new Error("Content-Type must be json");
      _err.status = 415;
      return next(_err);
    }

    var mode = req.body.mode;
    var data = req.body.data;

    if(!mode || !data){
      if(!mode)
        _err = new Error("Mode require!");
      else if(!data)
        _err = new Error("Data require!");

      _err.status = 428;
      return next(_err);
    }

    if(mode === "single" && data.length) {
      _err = new Error("At Single Mode, data must be object");
      _err.status = 415;
      return next(_err);
    }

    // if(req.body.ensureIndex){
    //   for(var key in req.body.ensureIndex){
    //     ensureIndex = {};
    //     ensureIndex.index = {};
    //     ensureIndex.index[key] = 1;
    //     ensureIndex.option = req.body.ensureIndex[key];
    //   }
    // }

    db.open(function(err, db) {
      // Fetch a collection to insert document into
      var collection = db.collection(req.mcol);
      collection.insert(data, {w:1}, function(err, result){
        if(err)
          next(err);
        else
          res.json({data: result});
        
        db.close();
      });
    });
  });

  this["put"]("/:collection", authCollection("write"), function(req, res, next){
    var _err;
    if(!req.get("Content-Type").match(/(application\/)*json/)){
      _err = new Error("Content-Type must be json");
      _err.status = 415;
      return next(_err);
    }

    var mode = req.body.mode;
    var query = req.body.query;
    var data = req.body.data;

    if(!mode || !query || !data){
      if(!mode)
        _err = new Error("Mode require!");
      if(!query)
        _err = new Error("Query require!");
      if(!data)
        _err = new Error("Data require!");

      _err.status = 428;
      return next(_err);
    }

    if(mode === "single" && data.length) {
      _err = new Error("At Single Mode, data must be object");
      _err.status = 415;
      return next(_err);
    }

    db.open(function(err, db) {
      // Fetch a collection to insert document into
      var collection = db.collection(req.mcol);
      collection.update(query, data, {upsert:true, w: 1, multi: (mode === "multi") }, function(err, result){
        if(err)
          next(err);
        else
          res.json({data: result});
        
        db.close();
      });
    });
  });

  this["delete"]("/:collection", authCollection("write"), function(req, res, next){
    var _err;
    if(!req.get("Content-Type").match(/(application\/)*json/)){
      _err = new Error("Content-Type must be json");
      _err.status = 415;
      return next(_err);
    }
    var mode = req.body.mode;
    var query = req.body.query;

    if(!mode || !query){
      if(!mode)
        _err = new Error("Mode require!");
      if(!query)
        _err = new Error("Query require!");

      _err.status = 428;
      return next(_err);
    }

    db.open(function(err, db) {
      // Fetch a collection to insert document into
      var collection = db.collection(req.mcol);
      collection.remove(query, {w: 1, multi: (mode === "multi") }, function(err, result){
        if(err)
          next(err);
        else
          res.json({success: true});
        
        db.close();
      });
    });
  });
});