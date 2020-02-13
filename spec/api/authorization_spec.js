var test = require('frisby');

test.create('Public authorization with anonymous read')
  .get('http://localhost:1337/')
  .expectStatus(200)
  .toss();
test.create('Public authorization with valid user read')
  .get('http://localhost:1337/')
  .auth('riemann', 'password')
  .expectStatus(200)
  .toss();
test.create('Public authorization with anonymous write')
  .post('http://localhost:1337/', {}, {json:true})
  .expectStatus(401)
  .toss();
test.create('Public authorization with valid user write')
  .post('http://localhost:1337/', {}, {json:true})
  .auth('riemann', 'password')
  .expectStatus(201)
  .toss();
