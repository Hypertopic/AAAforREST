const frisby = require('frisby');

const authorization = 'Basic ' + Buffer.from('riemann:password').toString('base64');

it('allows anonymous read', () => frisby
  .get('http://localhost:1337/')
  .expect('status', 200)
);

it('allows authenticated read', () => frisby
  .get('http://localhost:1337/', {headers: new Headers({authorization})})
  .expect('status', 200)
);

it('does not allow anonymous write', () => frisby
  .post('http://localhost:1337/', {})
  .expect('status', 401)
);

it('allows authenticated write', () => frisby
  .post('http://localhost:1337/', {
    body: {},
    headers: new Headers({
      authorization, 
      'Content-Type': 'application/json'
    })
  })
  .expect('status', 201)
);
