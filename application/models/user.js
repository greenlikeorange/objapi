var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var CONST = require("../../config/const");
var Hasher = require("../lib/password").hash;
/**
 * User Schema
 */
var UserSchema = new Schema({
  createdAt: { type: Date, default: Date.now, required: true },

  type: { type: String, required: true, default: "user" },
  username: { type: String, trim: true, required: true },
  email: { type: String, required: true, lowercase: true, unique: true, trim: true, match: /^(?:[\w\!\#\$\%\&\'\*\+\-\/\=\?\^\`\{\|\}\~]+\.)*[\w\!\#\$\%\&\'\*\+\-\/\=\?\^\`\{\|\}\~]+@(?:(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9\-](?!\.)){0,61}[a-zA-Z0-9]?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9\-](?!$)){0,61}[a-zA-Z0-9]?)|(?:\[(?:(?:[01]?\d{1,2}|2[0-4]\d|25[0-5])\.){3}(?:[01]?\d{1,2}|2[0-4]\d|25[0-5])\]))$/ },

  // Email Confirm
  confirmed: { type: Boolean, default: false, required: true },

  // Security Stuff
  hash: { type: String, required: true },
  salt: { type: String, required: true },

}, {strict: true});


UserSchema.pre("save", function(next){
  var user = this;
  if(user.isModified('hash')){
    Hasher(user.hash, function(err, salt, hash){
      if(err) return next(err);
      user.hash = hash;
      user.salt = salt;
      next();
    });
  } else {
    next();
  }
})

UserSchema.virtual('password').set(function(password){
  this._password = password;
  this.hash = password;
  this.salt = password;
}).get(function(){
  return false;
});

UserSchema.methods.validPassword = function(password, callback){
  var user = this;
  Hasher(password, user.salt, function(err, hash){
    if(hash && hash === user.hash){
      console.info("Password for %s is verified!", user.Username);
      callback(null, user);
    }else {
      console.info("Could't verify password for %s", user.Username);
      callback(new Error("Password is not verify"));
    }
  });
}

// Add constance valuables
CONST.setEnums(UserSchema, "User");
// Create MongoDB model
var User = mongoose.model("User", UserSchema);
// Defined read, writes
User.defs = CONST.getDefs("User");

User.prototype.toJSON = function(){
  var obj = this.toObject();
  obj.id = obj._id.toString();
}

module.exports = User;