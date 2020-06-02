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

### Dummy proxy

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
