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
