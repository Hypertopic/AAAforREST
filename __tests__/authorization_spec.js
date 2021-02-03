const frisby = require('frisby');

const APP_HOST = process.env.APP_HOST || 'http://localhost:1337';

const authorization = 'Basic ' + Buffer.from('riemann:password').toString('base64');

it('allows anonymous read', () => frisby
  .get(`${APP_HOST}/`)
  .expect('status', 200)
);

it('allows authenticated read', () => frisby
  .get(`${APP_HOST}/`, {headers: new Headers({authorization})})
  .expect('status', 200)
);

it('does not allow anonymous write', () => frisby
  .post(`${APP_HOST}/`, {})
  .expect('status', 401)
);

it('allows authenticated write', () => frisby
  .post(`${APP_HOST}/`, {
    body: {},
    headers: new Headers({
      authorization, 
      'Content-Type': 'application/json'
    })
  })
  .expect('status', 201)
);
