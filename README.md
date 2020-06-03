AAAforREST
==========

An HTTP reverse proxy to bring authentication, authorization and accounting to RESTful applications.

Contact: aurelien.benel@utt.fr

Home page: https://github.com/Hypertopic/AAAforREST


## Features

- Authentication
    - Frontend
        - HTTP basic
        - Cookie authentication
    - Backend
        - LDAP users
        - CouchDB users
- Authorization
    - POST, PUT, DELETE require authenticated users
    - more specific rules can be implemented on the backend
- Accounting
    - Log format can be configured

## Implementing your own reverse proxy

### featuring basic forwarding

```js
const app = require('express')();
const AAAforREST = require('aaaforrest');

const settings = {
  port: '80',
  service: 'https://my-bluemix.cloudant.com',
  path: '/cuicui/_design/app/_rewrite',
};

let aaa = new AAAforREST(settings);

app.route('*')
  .all(
    aaa.forward({preserveCredentials: true, preserveHost: false})
  );

app.listen(settings.port, function() {
  console.log(`Test it on http://localhost:${settings.port}/`)
});
```

### featuring basic authentication based on LDAP

```js
const app = require('express')();
const AAAforREST = require('aaaforrest');

const settings = {
  port: '80',
  service: 'https://my-bluemix.cloudant.com',
  path: '/cuicui/_design/app/_rewrite',
  ldap: {
    url: 'ldap://ldap.forumsys.com',
    searchBase: 'dc=example,dc=com',
    searchFilter: '(uId={{username}})'
  },
  secret: {
    name: 'apikey-ff9900',
    password: '1337'
  },
};

let aaa = new AAAforREST(settings);

app.route('*')
  .get(
    aaa.forward({preserveCredentials: false, preserveHost: false})
  )
  .all(
    aaa.parseAuthenticationHeader,
    aaa.checkAuthenticationOnLDAP,
    aaa.continueIfAuthentified,
    aaa.updateHeaders,
    aaa.forward({preserveCredentials: false, preserveHost: false})
  );

app.listen(settings.port, function() {
  console.log(`Test it on http://localhost:${settings.port}/`)
});
```

### featuring session authentication based on LDAP

```js
const app = require('express')();
const AAAforREST = require('aaaforrest');
const bodyParser = require('body-parser');
const session = require('express-session');
const cors = require('cors');

const settings = {
  port: '80',
  service: 'https://my-bluemix.cloudant.com',
  path: '/cuicui/_design/app/_rewrite',
  ldap: {
    url: 'ldap://ldap.forumsys.com',
    searchBase: 'dc=example,dc=com',
    searchFilter: '(uId={{username}})'
  },
  secret: {
    name: 'apikey-ff9900',
    password: '1337'
  },
  cors: {
    credentials: true,
    origin: 'http://cuicui.local:3000'
  },
  session: {
    secret: 'TO_BE_CHANGED',
    resave: false,
    saveUninitialized: false,
    unset: 'destroy'
  }
};

let getSession = session(settings.session);

let destroySession = function (request, response, next) {
  request.session = null;
  next();
}

let aaa = new AAAforREST(settings);

app.route('/_session')
  .post(
    cors(settings.cors),
    bodyParser.json({extended: false}),
    aaa.parseAuthenticationForm,
    aaa.checkAuthenticationOnLDAP,
    aaa.continueIfAuthentified,
    getSession,
    aaa.storeInSession,
    aaa.sendUser
  )
  .get(
    cors(settings.cors),
    getSession,
    aaa.loadInSession,
    aaa.sendUser
  )
  .delete(
    cors(settings.cors),
    getSession,
    destroySession,
    aaa.sendUser
  )
  .options(
    cors(settings.cors),
  );

app.route('*')
  .get(
    aaa.forward({preserveCredentials: false, preserveHost: false})
  )
  .options(
    aaa.forward({preserveCredentials: false, preserveHost: false})
  )
  .all(
    getSession,
    aaa.loadInSession,
    aaa.continueIfAuthentified,
    aaa.updateHeaders,
    aaa.forward({preserveCredentials: false, preserveHost: false})
  );

app.listen(settings.port, function() {
  console.log(`Test it on http://localhost:${settings.port}/`)
});

```

