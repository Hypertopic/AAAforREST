const frisby = require('frisby');

it('detects forged proxy authentication', () => frisby
  .post('http://localhost:1337/', {
    body: {},
    headers: new Headers({
      'Content-Type': 'application/json',
      'x-auth-couchdb-username': 'riemann',
      'x-auth-couchdb-roles': 'user'
    })
  })
  .expect('status', 401)
);

it('allows cross-origin resource sharing', () => frisby
  .get('http://localhost:1337/_session')
  .expect('header', 'Access-Control-Allow-Origin', 'http://localhost:3000')
  .expect('header', 'Access-Control-Allow-Credentials', 'true')
);
