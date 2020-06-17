var app = require('express')();
var bodyParser = require('body-parser');
var session = require('express-session');
var logger = require('morgan');
var cors = require('cors');
var yaml = require('yaml');
var fs = require('fs');
var AAAforREST = require('./index');

process.on('uncaughtException', function(e) {
  console.log(e.message);
  process.exit(1);
});

let settings = yaml.parse(fs.readFileSync('conf/config.yml', 'utf8'));
let aaa = new AAAforREST(settings);

let getSession = session(settings.session);

let destroySession = function (request, response, next) {
  request.session = null;
  next();
}

app.use(logger(settings.logFormat));

app.route('/_session')
  .post(
    cors(settings.cors),
    getSession,
    destroySession,
    aaa.continueIfContentType(['application/x-www-form-urlencoded','application/json']),
    bodyParser.urlencoded({extended: false}),
    bodyParser.json({extended: false}),
    aaa.parseAuthenticationForm,
    aaa.checkAuthenticationOnLDAP,
    aaa.checkAuthenticationOnHTTP,
    aaa.continueIfAuthentified,
    getSession,
    aaa.storeInSession,
    aaa.sendUser
  ).get(
    cors(settings.cors),
    getSession,
    aaa.loadInSession,
    aaa.sendUser
  ).delete(
    cors(settings.cors),
    getSession,
    destroySession,
    aaa.sendUser
  ).options(
    cors(settings.cors),
  );

app.route('/_users/*')
  .all(
    aaa.forward({preserveCredentials: true})
  );

app.route('*')
  .get(
    aaa.forward({preserveCredentials: false})
  ).options(
    aaa.forward({preserveCredentials: false})
  ).all(
    getSession,
    aaa.loadInSession,
    aaa.parseAuthenticationHeader,
    aaa.checkAuthenticationOnLDAP,
    aaa.checkAuthenticationOnHTTP,
    aaa.continueIfAuthentified,
    aaa.updateHeaders,
    aaa.forward({preserveCredentials: false})
  );

app.listen(settings.port, function() {
  console.log(`Test it on http://localhost:${settings.port}/`);
});
