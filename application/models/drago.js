var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var CONST = require("../../config/const");
var crypto = require("crypto");

/**
 * Dragos Schema
 */
var DragoSchema = new Schema({
  createdAt: { type: Date, default: Date.now, required: true },

  users: [{
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["owner", "admin", "developer"], required: true, default: "owner" }
  }],

  name: { type: String, trim: true, lowercase: true, required: true, match: /^([a-z][a-z0-1_-]+)$/, index: { unqie: true } },
  description: { type: String, trim: true, required: true },

  gcmkeys: { type: [String], trim: true },
  apnkeys: { type: [String], trim: true },

  access_token: [{
    name: { type: String, required: true, default: "autogenerate" },
    token: { type: String, required: true },
    readBlock: { type: [String] },
    writeBlock: { type: [String] },
  }]

}, {strict: true});

DragoSchema.pre("save", function(next){
  var drago = this;
  if(!drago.access_token || drago.access_token.length === 0){
    crypto.randomBytes(32, function(err, salt){
      if (err) return next(err);
      drago.access_token = [ {
        token: salt.toString("hex"),
        readBlock: [],
        writeBlock: []}];
      next();
    });
  } else {
    next();
  }
});

// Add constance valuables
CONST.setEnums(DragoSchema, "Drago");
// Create MongoDB model
var Drago = mongoose.model("Drago", DragoSchema);
// Defined read, writes
Drago.defs = CONST.getDefs("Drago");

module.exports = Drago;