var http = require("http");
var Errors = {};
var _ERR_CODES = http.STATUS_CODES;
var colors = require("colors");
var code = 400;
for(; code < 512; code++) {
  if(_ERR_CODES[code]){
    var _message = _ERR_CODES[code].replace(/[\s-']/g, "");
    // console.log( (code+"::").green + _message.white);
    
    var _err = (function(code){
      return function(message){
        this.code = code;
        this.status = code;
        this.message = _ERR_CODES[code] || _err.message;
      };
    }(code));

    _err.prototype = Object.create(Error.prototype);
    _err.prototype.constructor = _err;

    _err.code =  +(code+"");
    _err.status =  +(code+"");
    _err.message =  _ERR_CODES[code];

    Errors[_message] = _err;
  }
}

module.exports = Errors;