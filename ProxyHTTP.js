var http = require('http');
var fs = require('fs');
var ldap = require('ldapjs');
var url = require('url');
var time = require ('timers');

function isFunction(fun) { return typeof fun == "function";}

if (fs.existsSync('config.js')) {
  var conf = require("./config");
}
if (fs.existsSync('config.json')) {
  // Reading of the main configuration file : config.json
  var conf = JSON.parse(
    fs.readFileSync('config.json', 'utf8')
  );
}

if (!conf) {
  console.log("please configure the reverse Proxy");
  process.exit(1);
}

// Function that write the log inside the file related to right server

var log = function (context, err, code){
  var rule=context.hasOwnProperty("ruleNo") ?
    "["+context.ruleNo+"]":
    "[##]";
  if (context.restricted){
    if (err == "HTTP" && context.login)var data = "" + context.date + "\t" + context.login + "\t" + context.req.method + "\t" + context.req.url + "\t" + code +"\t"+rule+"\n";
    else var data = "" + context.date + "\t" + err +"\n";
  }else if (err == "HTTP")var data = "" + context.date + "\t" + context.req.method + "\t" + context.req.headers.host + context.req.url + "\t" + code +"\t"+rule+"\n";
  
  if (data){
    console.log(data);
    if (context.conf) fs.appendFileSync(conf[context.conf].logFile, data);
    else fs.appendFileSync("ProxyHTTP.log", data); //change the name of the proxy log file inside the code
  };
};

// Test function for basic http authentication with a fixed login/password defined in config.json

var authentifyDummy =function (context, callback){
  
  context.restricted = true;

  if(!context.req.headers.authorization){
    context.res.statusCode = 401;
    context.res.setHeader('WWW-Authenticate', 'Basic realm="Secure Area"');
    log(context, "HTTP", 401);
    context.res.end();
  }else{
    if(context.login === conf[context.conf].authData.login && context.pw === conf[context.conf].authData.pw){
      callback();
    }else{
      context.res.statusCode = 401;
      context.res.setHeader('WWW-Authenticate', 'Basic realm="Secure Area"');
      log(context, "HTTP", 401);
      context.res.end();
    }
  }
}

// Cache of recent LDAP bind informations

var servLDAP = {};

// Function that remove old cached informations about LDAP bind

var flush = function(id, server){
  delete servLDAP[server][id];
  if (servLDAP[server] === {}) delete servLDAP[server];
};

// LDAP bind with HTTP basic authentication

var authentifyLDAP =function (context, callback){

  context.restricted = true;

  if(!context.req.headers.authorization){
    context.res.statusCode = 401;
    context.res.setHeader('WWW-Authenticate', 'Basic realm="Secure Area"');
    log(context, "HTTP", 401);
    context.res.end();
  }else{
    if (!servLDAP[conf[context.conf].ldap.url] || !servLDAP[conf[context.conf].ldap.url][context.auth]){

      ldapReq = conf[context.conf].ldap.id+ context.login +','+conf[context.conf].ldap.cn; //do not manage more than one dc information
      var serveursLDAP=ldap.createClient({
        'url' : conf[context.conf].ldap.url
      });

      serveursLDAP.bind(ldapReq, context.pw, function(err) { 
        if (!err) {
	        if (!servLDAP[conf[context.conf].ldap.url]) {
            servLDAP[conf[context.conf].ldap.url] ={};
            servLDAP[conf[context.conf].ldap.url][context.auth.toString()] = setTimeout(flush, 600000, [context.auth], [conf[context.conf].ldap.url]);
          }else{
            servLDAP[conf[context.conf].ldap.url][context.auth.toString()] = setTimeout(flush, 600000, [context.auth], [conf[context.conf].ldap.url]);
          }
          serveursLDAP.unbind(function(){
            callback();
          });
        }else{
	        console.log("LDAP error : " + JSON.stringify(err));
          log(context, err, 0);
          context.res.statusCode = 401;
          context.res.setHeader('WWW-Authenticate', 'Basic realm="Secure Area"');
          log(context, "HTTP", 401);
          context.res.end();
        }
      });
    }else{
      clearTimeout(servLDAP[conf[context.conf].ldap.url][context.auth.toString()]);
      servLDAP[conf[context.conf].ldap.url][context.auth.toString()] = setTimeout(flush, 600000, [context.auth], [conf[context.conf].ldap.url]);
      callback();
    }
  }
}

// Function that manage the authorization to access to specific resources defined inside config.json

var AuthorizList =function (context, callback){

  context.restricted = true;

  var idDoc = context.req.url.split('/')[3];
  if(conf[context.conf].restricted[idDoc]){
    if (conf[context.conf].restricted[idDoc].indexOf(context.login) == -1){
      context.res.statusCode = 403;
      log(context, "HTTP", 403);
      context.res.end("Forbidden");
    } else callback();
  }else{
    callback();
  }
}

// Main proxy function that forward the request and the related answers

var proxyWork = function(context, callback){
   var proxyReq = http.request(context.options, function (res){

    if (res.headers.location && conf[context.conf].rewritePath.enable){
      var splitHeaders = res.headers.location.split('/');
      res.headers.location = context.req.headers.origin;
      for (var i = (3 + conf[context.conf].rewritePath.headersOffset); i < splitHeaders.length; i++) {
        res.headers.location = res.headers.location +'/'+ splitHeaders[i];
      }
    }
    context.res.writeHead(res.statusCode, res.headers);
    log(context, "HTTP", res.statusCode);
    res.on('data',function(chunkOrigin) {
        context.res.write(chunkOrigin);
    });
    res.on('end', function(){
      context.res.end();
    });
  });

  proxyReq.on('error', function(err){
    console.log('problem with the server: ' + JSON.stringify(err));
    context.res.writeHead(504);
    log(context, "HTTP", 504);
    context.res.end("Gateway Timeout");
  });

  context.req.on('data', function(chunkInit){
    proxyReq.write(chunkInit)
  });

  context.req.on('error', function(err) {
    log(context, err, 0);
    console.log('problem with request: ' + err.message);
  });

  context.req.on('end', function(){
    proxyReq.end();
    isFunction(callback) && callback();
  });
}

// Function that allow to find the index of the requested server inside config.json

var matching = function(host){ 
  var verif = false;
  var i =0;
  while ((verif == false) && (i < conf.length)){
    var re = new RegExp(conf[i].hostProxy, "i");
    verif = re.test(host);
    if (verif == false)i++;
  };
  if (verif == false ) i = -1;
  return i;
};

// Main HTTP server

http.createServer(function (request, response){
  var context = {
    "req": request,
    "res": response,
    "date": new Date(),
    log: log,
    proxyWork: proxyWork,
    AuthorizList: AuthorizList,
    authentifyLDAP: authentifyLDAP,
    authentifyDummy: authentifyDummy
  };
  var index = matching(request.headers.host);
  if(index == -1){
    response.writeHead(404);
    log(context, "HTTP", 404);
    response.end("Not Found");
  }else{
  	context.conf = index;
    
    var head = JSON.parse(JSON.stringify(request.headers)); 
    if (request.headers.authorization && conf[index].hideAuth) delete head.authorization;
    if (!conf[index].preserveHost) delete head.host;
    
    var options = {
      'host': conf[index].host,
      'port': conf[index].port, 
      'path': conf[index].path + url.parse(request.url).path,
      'method': request.method,
      'headers': head,
      'agent': false
    };

    context.options = options;

    if (request.headers.authorization){
      context.auth = request.headers.authorization.split(" ")[1];
      context.login = new Buffer(context.auth, 'base64').toString().split(':')[0];
      context.pw = new Buffer(context.auth, 'base64').toString().split(':')[1];
    };

    var i=0;
    var breaker = false;
    var found=false;
    while(i<conf[index].rules.length && !breaker){
      var control=conf[index].rules[i].control;
      var action=conf[index].rules[i].action;
      var test=false;
      if(isFunction(control)) test=control(context);
      else if (typeof control == "string") test=eval(control);
      if (test===true) {
        found=true;
        context.ruleNo=i;
        if (isFunction(action)){
          action(context);
        } else {
	  eval(action);
        }
        breaker = conf[index].rules[i].final;
      }
      i++;
    }
    if (!found) {
      proxyWork(context, function(){
      });
    }
  }
}).listen(1337); // port has to be changed directly inside the code. 
console.log('Server running port 1337');
