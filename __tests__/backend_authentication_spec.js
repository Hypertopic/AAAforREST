const frisby = require('frisby');

let auth = (username, password) => ({
  headers: new Headers({
    'Authorization': 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64'),
    'Content-Type': 'application/json'
  }),
  body: {}
});

it('authenticates if HTTP authentication succeedes', () => frisby
  .post('http://localhost:1337/', auth('alice', 'whiterabbit'))
  .expect('status', 201)
);

it('does not authenticate if HTTP authentication fails', () => frisby
  .post('http://localhost:1337/', auth('alice', 'madhatter'))
  .expect('status', 401)
);

it('authenticates if LDAP authentication succeedes', () => frisby
  .post('http://localhost:1337/', auth('riemann', 'password'))
  .expect('status', 201)
);

it('does not authenticate if LDAP authentication fails while the user is registered in LDAP (even if HTTP authentication may succeed)', () => frisby
  .post('http://localhost:1337/', auth('riemann', 'secret'))
  .expect('status', 401)
);
