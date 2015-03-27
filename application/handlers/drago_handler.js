var Handler = require("./mother");
var DragoHandler = Handler("Drago");

DragoHandler.beforeSave = function(object, raw, conditions, callback, extension){
  if(raw.users)
    object.users = raw.users;

  object.gcmkeys = raw.gcmkeys || [];

  if(typeof extension === 'function')
    return extension(object, raw, conditions, callback);
  
  object.save(callback);
};

module.exports = DragoHandler;