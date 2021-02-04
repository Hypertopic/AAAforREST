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
   * authenticationService: {string}
   * path: {string}
   * secret: {string}
   * ldap:
   *  url: {string}
   *  searchBase: {string}
   *  searchFilter: {string}
   */
  constructor(settings) {
    this.settings = settings;
    this.directory = (settings.ldap)? new Ldap(settings.ldap) : null;    
  }

  forward = ({preserveCredentials = true, preserveHost = true} = {}) => {
    return proxy(this.settings.service, {
      preserveHostHdr: preserveHost,
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
    let {name, password} = request.body; 
    request.auth = {name, password};
    next();
  }

  parseAuthenticationHeader = (request, response, next) => {
    if (request.headers.authorization) {
      let {name, pass} = basicAuth(request) || {};
      request.auth = {name, password: pass};
    }
    next();
  }

  checkAuthenticationOnHTTP = (request, response, next) => {
    if (request.auth && request.auth.password && request.auth.success === undefined) {
      fetch(`http://${this.settings.authenticationService || this.settings.service}/`, {
        headers: basic(request.auth)
      })
        .then((x) => {
          request.auth.success = x.ok;
          next();
        });
    } else {
      next();
    }
  }

  checkAuthenticationOnLDAP = (request, response, next) => {
    if (request.auth && request.auth.password && this.directory) {
      this.directory.authenticate(request.auth.name, request.auth.password, function(err, user) {
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
      response.set('WWW-Authenticate', 'Basic realm=""');
      response.sendStatus(401);
    }
  }

  updateHeaders = (request, response, next) => {
    let secret = this.settings.secret;
    if (secret && request.auth) {
      let additional_headers = {};
      if (secret.name && secret.password) {
        additional_headers = basic(secret);
      } else if (typeof secret === 'string') {
        additional_headers = {
          'X-Auth-CouchDB-UserName': request.auth.name,
          'X-Auth-CouchDB-Roles': 'user',
          'X-Auth-CouchDB-Token': createHmac('sha1', this.settings.secret)
            .update(request.auth.name).digest('hex')
        }
      } else {
        console.error('`secret` should be either a string or API credentials');
      }
      request.headers = Object.assign(additional_headers, request.headers);
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

function basic({name, password}) {
  return {
    'Authorization': 'Basic '
      + Buffer.from(`${name}:${password}`).toString('base64')
  };
}

