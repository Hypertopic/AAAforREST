const frisby = require('frisby');

const APP_HOST = process.env.APP_HOST || 'http://localhost:1337';

it('detects forged proxy authentication', () => frisby
  .post(`${APP_HOST}/`, {
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
  .get(`${APP_HOST}/_session`)
  .expect('header', 'Access-Control-Allow-Origin', 'http://localhost:3000')
  .expect('header', 'Access-Control-Allow-Credentials', 'true')
);
