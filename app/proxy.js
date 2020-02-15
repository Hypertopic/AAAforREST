var app = require('express')();
var proxy = require('express-http-proxy');
var bodyParser = require('body-parser');
var session = require('express-session');
var Ldap = require('ldapauth-fork');
var basicAuth = require('basic-auth');
var logger = require('morgan');
var cors = require('cors');
var createHmac = require('crypto').createHmac;
var yaml = require('yaml');
var fs = require('fs');
var fetch = require('node-fetch');

process.on('uncaughtException', function(e) {
  console.log(e.message);
  process.exit(1);
});

let settings = yaml.parse(fs.readFileSync('conf/config.yml', 'utf8'));
let directory = new Ldap(settings.ldap);

// Express middleware

let getSession = session(settings.session);

let setProxy = proxy(settings.service, {
  preserveHostHdr: true,
  proxyReqPathResolver: (req) => settings.path + req.url,
  proxyReqOptDecorator: function(req) {
    delete req.headers.authorization;
    return req;
  }
});

let destroySession = function (request, response, next) {
  request.session = null;
  next();
}

let continueIfContentType = function(types) {
  return function(request, response, next) {
    if (types.includes(request.headers["content-type"])) {
      next();
    } else {
      response.sendStatus(415);
    }
  };
}

let parseAuthenticationForm = function(request, response, next) {
  request.auth = {
    name: request.body.name,
    pass: request.body.password
  }
  next();
};

let checkAuthenticationOnLDAP = function(request, response, next) {
  if (request.auth && request.auth.pass) {
    directory.authenticate(request.auth.name, request.auth.pass, function(err, user) {
      if (!(/^no such user/.test(err))) {
        request.auth.success = !err;
      }
      next();
    });
  } else {
    next();
  }
};

let checkAuthenticationOnHTTP = function(request, response, next) {
  if (request.auth && request.auth.pass && request.auth.success === undefined) {
    let headers = {
      'Authorization': 'Basic '
        + Buffer.from(request.auth.name + ":" + request.auth.pass).toString('base64')
    };
    fetch(`http://${settings.service}/`, {headers})
      .then((x) => {
        request.auth.success = x.ok;
        next();
      });
  } else {
    next();
  }
};

let continueIfAuthentified = function(request, response, next) {
  if (request.auth && request.auth.success) {
    next();
  } else {
    response.sendStatus(401);
  }
};

let storeInSession = function(request, response, next) {
  request.session.name = request.auth.name;
  next();
};

let sendUser = function(request, response, next) {
  let o = {ok:true};
  if (request.auth) {
    o.name = request.auth.name;
  }
  response.json(o);
};

let loadInSession = function(request, response, next) {
  if (!request.auth && request.session && request.session.name) {
    request.auth = {
      name: request.session.name,
      success: true
    };
  }
  next();
};

let parseAuthenticationHeader = function(request, response, next) {
  if (request.headers.authorization) {
    request.auth = basicAuth(request) || null;
  }
  next();
};

let updateHeaders = function(request, response, next) {
  if (request.auth) {
    request.headers = Object.assign({
      'X-Auth-CouchDB-UserName': request.auth.name,
      'X-Auth-CouchDB-Roles': 'user',
      'X-Auth-CouchDB-Token': createHmac('sha1', settings.secret).update(request.auth.name).digest('hex')
    }, request.headers);
  }
  next();
};

// Express app configuration

app.use(logger(settings.logFormat));

app.route('/_session')
  .post(
    cors(settings.cors),
    getSession,
    destroySession,
    continueIfContentType(['application/x-www-form-urlencoded','application/json']),
    bodyParser.urlencoded({extended: false}),
    bodyParser.json({extended: false}),
    parseAuthenticationForm,
    checkAuthenticationOnLDAP,
    checkAuthenticationOnHTTP,
    continueIfAuthentified,
    getSession,
    storeInSession,
    sendUser
  ).get(
    cors(settings.cors),
    getSession,
    loadInSession,
    sendUser
  ).delete(
    cors(settings.cors),
    getSession,
    destroySession,
    sendUser
  ).options(
    cors(settings.cors),
  );

app.route('*')
  .get(
    setProxy
  ).options(
    setProxy
  ).all(
    getSession,
    loadInSession,
    parseAuthenticationHeader,
    checkAuthenticationOnLDAP,
    checkAuthenticationOnHTTP,
    continueIfAuthentified,
    updateHeaders,
    setProxy
  );

app.listen(settings.port, function() {
  console.log(`Test it on http://localhost:${settings.port}/`);
});
