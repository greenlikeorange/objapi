var express = require('express');

module.exports = function(NSModel, extensions){
  // Create Router
  var router = express.Router.apply(express, Array.prototype.slice.call(arguments, 3));

  // Calling Handler
  var handlerPath = "../handlers/"+ NSModel.toLowerCase() +"_handler";
  var handler;

  var Model = require("../models/" + NSModel.toLowerCase());
  
  try {
    handler = require(handlerPath);
  } catch(err) {
    // console.error(err);
    handler = new require("../handlers/mother")(NSModel);
  }

  // If any extensions add them (problem with order here)
  if(extensions){
    extensions.call(router, Model, handler);
  }

  return router;
}