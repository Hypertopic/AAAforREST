var test = require('frisby');

test.create('Can\'t forge proxy auth')
  .post('http://localhost:1337/', {}, {json:true})
  .addHeader('x-auth-couchdb-username','riemann')
  .addHeader('x-auth-couchdb-roles','user')
  .expectStatus(401)
  .toss();

test.create('CORS site policy')
  .get('http://localhost:1337/_session')
  .expectHeader('Access-Control-Allow-Origin', '*')
  .expectHeader('Access-Control-Allow-Credentials', 'true')
  .toss();
