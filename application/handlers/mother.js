/**
 * Handler Class
 * @param NSmodel[String]: The name of model which mainly use on controller
 * @param Option[Object]: The option
 */

"use strict";
function Handler(NSmodel, Option){
  
  if(this instanceof Handler){
    try{
      this.model = require('../models/' + NSmodel.toLowerCase());
    }catch(err){
      console.error(err);
    }
    this.nsmodel = NSmodel;
    this.plural = NSmodel.toLowerCase() + "s";
  } else {
    return new Handler(NSmodel, Option);
  }
    
};

Handler.prototype =  {

  /**
   * Saving reality object
   * @param object[ModelObject]: the model object
   * @param conditions[Object]: Filtered conditions with `write` rules
   * @param raw[Object]: Raw Data
   * @param callback[Function]: Callback function
   * @param extension[Function]: Extension function
   *
   */
  _save: function(object, raw, conditions, callback, extension){
    
    /* _save method got Application permission */
    var keys = this.model.defs._app, key;

    for(key in conditions){
      if(keys.indexOf(key) !== -1)
        object[key] = conditions[key];
    }

    /* It there is `Before` Function provided, Object will not save here */
    if(this.beforeSave)
      return this.beforeSave(object, raw, conditions, callback, extension);

    /* It there is `Extension` Function provided, Object will not save here */
    if(typeof extension === 'function')
      return extension(object, raw, conditions, callback);
        
    object.save(callback);
  },

  /**
   * SetValue will define write permitted value on model
   * @param object[Object]: The Model Object or condition
   * @param raw[Object]: The Raw input
   * @return [Object]: Formated Object or Condition
   */
  _setValues: function(object, data){
    var keys = this.model.defs.write, key;
    for(key in data){
      if(keys.indexOf(key) !== -1)
        object[key] = data[key];
    }
    return object;
  },

  /**
   * Model Creator
   * This will also automatically save and then execute callback  
   * @param raw[Object]: Raw data on new model, eg: req.body
   * @param callback[Function]: The callback function
   * @param extension[Function]: The extension function which will execute before save,
   *        When extension is include, new model will not save.
   *
   */
  create: function(raw, callback, extension){
    var object = new this.model();
    var conditions = this._setValues({}, raw);

    this._save(object, raw, conditions, callback, extension);
  },

  /**
   * Model Updater
   * This will also automatically save and then execute callback
   * @param object[Object]: The object
   * @param raw[Object]: Raw data on new model, eg: req.body
   * @param callback[Function]: The callback function
   * @param extension[Function]: The extension function which will execute before save,
   *        When extension is include, new model will not save.
   *
   */
  update: function(querys, raw, callback, extension){
    var that = this;
    var object, conditions;

    // When querys is ID
    if(typeof querys === "string"){
      querys = { "_id": querys };
    } else if (querys instanceof this.model){
      object = querys;
    } else if(typeof querys === "object") {
      delete querys.__v;
    }

    conditions = this._setValues({}, raw);

    if(object) 
      return this._save(object, raw, conditions, callback, extension);

    this.model.findOne(querys, function(err, object){
      if(err){
        callback(err);
      } else if(!object) {
        err = new Error(that + " not found!");
        err.status = 404;
        callback(err);
      } else {
        that._save(object, raw, conditions, callback, extension)
      }
    });
    
  },

  /* Removing or Deleting */
  remove: function(querys, callback){
    var that = this;

    // When querys is ID
    if(typeof querys === "string"){
      querys = { "_id": querys };
    } else if (querys instanceof this.model){
      object = querys;
    } else if(typeof querys === "object") {
      delete querys.__v;
    }

    this.model.findOneAndRemove(querys, function(err, object){
      if(err){
        callback(err);
      } else if(!object) {
        err = new Error(that + " not found!");
        err.status = 404;
        callback(err);
      } else {
        callback(null, {success: true});
      }
    });
  }

};

module.exports = Handler;