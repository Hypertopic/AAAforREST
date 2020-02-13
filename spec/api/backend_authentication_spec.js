var test = require('frisby');

test.create('HTTP authentication succeeded')
  .post('http://localhost:1337/', {}, {json:true})
  .auth('alice', 'whiterabbit')
  .expectStatus(201)
  .toss();

test.create('HTTP authentication failed')
  .post('http://localhost:1337/', {}, {json:true})
  .auth('alice', 'madhatter')
  .expectStatus(401)
  .toss();

test.create('LDAP authentication succeeded')
  .post('http://localhost:1337/', {}, {json:true})
  .auth('riemann', 'password')
  .expectStatus(201)
  .toss();

test.create('LDAP authentication failed on password: no fallback on HTTP')
  .post('http://localhost:1337/', {}, {json:true})
  .auth('riemann', 'secret') //TODO add these credentials to CouchDB for tests
  .expectStatus(401)
  .toss();
