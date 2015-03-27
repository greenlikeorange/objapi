/**
 * Module dependencies.
 */
var http = require("http");

function Server(name, controller, port, debug){
  this.name = name;
  this.controller = controller;
  this.port = isNaN(port) ? (+ port ) : port;
  this.debug = require("debug")(debug);
  return this;
}

Server.prototype.onListening = function(){

  var addr = this.server.address();
  var debug = this.debug;

  return function(){
    var bind = typeof addr === 'string'
      ? 'pipe ' + addr
      : 'port ' + addr.port;
    debug('Listening on ' + bind);
  }
};

Server.prototype.onError = function(){

  var addr = this.server.address;

  return function(error){

    if (error.syscall !== 'listen') {
      throw error;
    }

    var bind = typeof addr === 'string'
      ? 'Pipe ' + addr
      : 'Port ' + addr.port;

    // handle speci
    switch (error.code) {
      case 'EACCES':
        console.error(bind + ' requires elevated privileges');
        process.exit(1);
        break;
      case 'EADDRINUSE':
        console.error(bind + ' is already in use');
        process.exit(1);
        break;
      default:
        throw error;
    }
  }
};

Server.prototype.createServer = function(){
  this.server = http.createServer(this.controller);
  this.server.listen(this.port);
  console.log(this.name+ " Server is started at port " + this.port);
  this.server.on("error", this.onError());
  this.server.on("listening", this.onListening());
};

var application = require("../application/app");
var app = new Server("OBJECT API", application, 80, "kupid.server:API");

app.createServer();