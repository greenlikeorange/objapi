var CONST = {
  "User": {
    "enums": {
      "type": ["admin", "user"]
    },
    "defs": {
      "_app": [
        "type",
        "username",
        "email",
        "password",
      ],
      "write": [
        "username",
        "email",
        "password"
      ]
    }
  },
  "Drago": {
    "defs": {
      "_app": [
        "users",
        "name",
        "description",
        "gcmkeys",
        "apnkeys"
      ],
      "write": [
        "name",
        "description"
      ]
    }
  },
  "Collection": {
    "defs": {
      "_app": ["name", "drago", "savedSchema", "events", "calls"],
      "write": ["name", "drago", "savedSchema"]
    }
  }
};


function get( modelName, type ){
  if(CONST[modelName] && CONST[modelName][type])
    return CONST[modelName][type];
  else
    return {};
}

module.exports = {
  /**
   * Setting EnumValues after Schema was set
   */
  setEnums: function( Schema, modelName ){
    var enums = get( modelName, "enums" );
    var key;
    for(key in enums){
      Schema.path(key).enum.apply(Schema.path(key), enums[key]);
    }
  },
  /* PreDefined Schema's Definitions */
  getDefs: function( modelName ){
    return get( modelName, "defs" );
  }
};
