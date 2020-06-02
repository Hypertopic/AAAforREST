const proxy = require('express-http-proxy');
const basicAuth = require('basic-auth');
const Ldap = require('ldapauth-fork');
const fetch = require('node-fetch');
const createHmac = require('crypto').createHmac;
const session = require('express-session');

/**
 * Every method (except the constructor) returns an Express middleware.
 */
module.exports = class AAAforREST { 

  /**
   * service: {string}
   * path: {string}
   * secret: {string}
   * ldap:
   *  url: {string}
   *  searchBase: {string}
   *  searchFilter: {string}
   * session:
   *  secret: {string} 
   *  resave: {boolean}
   *  saveUninitialized: {boolean}
   *  unset: {string}
   */
  constructor(settings) {
    this.settings = settings;
    this.directory = (settings.ldap)? new Ldap(settings.ldap) : null;    
  }

  forward = ({preserveCredentials = true, https = false} = {}) => {
    return proxy(this.settings.service, {
      https,
      preserveHostHdr: true,
      proxyReqPathResolver: (req) => this.settings.path + req.url,
      proxyReqOptDecorator: function(req) {
        if (!preserveCredentials) delete req.headers.authorization;
        return req;
      }
    })
  }

  continueIfContentType = (types) => (request, response, next) => {
    if (types.includes(request.headers["content-type"])) {
      next();
    } else {
      response.sendStatus(415);
    }
  }

  parseAuthenticationForm = (request, response, next) => {
    request.auth = {
      name: request.body.name,
      pass: request.body.password
    }
    next();
  }

  parseAuthenticationHeader = (request, response, next) => {
    if (request.headers.authorization) {
      request.auth = basicAuth(request) || null;
    }
    next();
  }

  checkAuthenticationOnHTTP = (request, response, next) => {
    if (request.auth && request.auth.pass && request.auth.success === undefined) {
      let headers = {
        'Authorization': 'Basic '
          + Buffer.from(request.auth.name + ":" + request.auth.pass).toString('base64')
      };
      fetch(`http://${this.settings.service}/`, {headers})
        .then((x) => {
          request.auth.success = x.ok;
          next();
        });
    } else {
      next();
    }
  }

  checkAuthenticationOnLDAP = (request, response, next) => {
    if (request.auth && request.auth.pass && this.directory) {
      this.directory.authenticate(request.auth.name, request.auth.pass, function(err, user) {
        if (!(/^no such user/.test(err))) {
          request.auth.success = !err;
        }
        next();
      });
    } else {
      next();
    }
  }

  continueIfAuthentified = (request, response, next) => {
    if (request.auth && request.auth.success) {
      next();
    } else {
      response.sendStatus(401);
    }
  }

  updateHeaders = (request, response, next) => {
    if (request.auth) {
      request.headers = Object.assign({
        'X-Auth-CouchDB-UserName': request.auth.name,
        'X-Auth-CouchDB-Roles': 'user',
        'X-Auth-CouchDB-Token': createHmac('sha1', this.settings.secret).update(request.auth.name).digest('hex')
      }, request.headers);
    }
    next();
  }

  sendUser = (request, response, next) => {
    let o = {ok: true};
    if (request.auth) {
      o.name = request.auth.name;
    }
    response.json(o);
  }

  storeInSession = (request, response, next) => {
    request.session.name = request.auth.name;
    next();
  }

  loadInSession = (request, response, next) => {
    if (!request.auth && request.session && request.session.name) {
      request.auth = {
        name: request.session.name,
        success: true
      };
    }
    next();
  }

}
