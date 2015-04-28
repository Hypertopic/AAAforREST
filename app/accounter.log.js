module.exports = function() {

  var configuration = require('./configuration');
  var loggers = require('winston').loggers;
  var winstonLoggerFactory = require('winston').Logger;
  var couchDBTransport = require('winston-couchdb').Couchdb;

  var loggerDocument = new (winstonLoggerFactory)({
    transports: [
      new (couchDBTransport)({
          timestamp:true,
          host: configuration.logs.host || '127.0.0.1',
          db: configuration.logs.dbName || 'AAAforREST',
          port: configuration.logs.port || 5984
      })
    ]
  });

  function addLogger(name) {
    loggers.add(name, {
      console: {timestamp:true, json:false, colorize:true},
      file: {
        timestamp:true, json:false, filename: 'log/' + name + '.log'
      }
    });
  }
  configuration.sites.forEach(function(site) {
    addLogger(site.hostProxy);
  });
  addLogger('misc');

  return function(context, err, code) {
    var request = context.requestIn;
    var site = configuration.sites[context.conf];
    var logger = loggers.get(site?site.hostProxy:'misc');
    logger.info(
      (context.login? context.login + '@' : '')
      + (request.headers['x-forwarded-for'] || request.connection.remoteAddress)
      + '\t' + request.method 
      + '\t' + request.headers.host + request.url 
      + '\t' + code
    );
    loggerDocument.info({
      login: (context.login ? context.login : undefined),
      from: (request.headers['x-forwarded-for'] || request.connection.remoteAddress),
      method: request.method,
      target: request.headers.host + request.url,
      result: code
    });
  };

}();
