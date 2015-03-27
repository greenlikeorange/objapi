var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var CONST = require("../../config/const");

/**
 * Data Base Collection
 */
var CollectionSchema = new Schema({
  createdAt: { type: Date, default: Date.now, required: true },
  updatedAt: { type: Date, default: Date.now, required: true },

  name: { type: String, trim: true, lowercase: true, required: true, match: /^([a-z][a-z0-1_-]+)$/ },
  drago: { type: Schema.Types.ObjectId, ref: "Drago", required: true },

  events: [
    {
      eventOn: { type: String },
      eventAt: { type: [String] },
      eventRule: { type: String }
    }
  ],

  savedSchema: { type: Schema.Types.Mixed, default: {} },

  /* API Calls records by monthly */
  calls: [{
    calledAt: { type: Date, default: Date.now },
    access_type: { type: String, enum: ["read", "write"] },
    ips: { type: [String] },
    originalUrl: { type: String  }
  }]
}, {strict: true});

// Add constance valuables
CONST.setEnums(CollectionSchema, "Collection");
// Create MongoDB model
var Collection = mongoose.model("Collection", CollectionSchema);
// Defined read, writes
Collection.defs = CONST.getDefs("Collection");

module.exports = Collection;