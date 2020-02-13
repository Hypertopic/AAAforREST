var test = require('frisby');

test.create('HTTP basic authentication')
  .post('http://localhost:1337/', {}, {json:true})
  .auth('alice', 'whiterabbit')
  .expectStatus(201)
  .toss();

test.create('Site cookie authentication with valid credentials')
  .get('http://localhost:1337/_session')
  .expectStatus(200)
  .expectJSON({name: undefined})
  .after(function() {
    test.create('Cookie creation')
      .post('http://localhost:1337/_session', {name:'alice', password:'whiterabbit'})
      .expectStatus(200)
      .after(function(error, resource) {
        var cookie = resource.headers['set-cookie'];
        test.create('Cookie information')
          .get('http://localhost:1337/_session')
          .addHeader('Cookie', cookie)
          .expectStatus(200)
          .expectJSON({name: 'alice'})
          .after(function() {
            test.create('Cookie use')
              .post('http://localhost:1337/', {}, {json:true})
              .addHeader('Cookie', cookie)
              .expectStatus(201)
              .after(function() {
                test.create('Cookie deletion')
                  .delete('http://localhost:1337/_session')
                  .addHeader('Cookie', cookie)
                  .expectStatus(200)
                  .after(function() {
                    test.create('Cookie information')
                      .get('http://localhost:1337/_session')
                      .addHeader('Cookie', cookie)
                      .expectJSON({name: undefined})
                      .after(function() {
                        test.create('Cookie use')
                          .post('http://localhost:1337/', {}, {json:true})
                          .addHeader('Cookie', cookie)
                          .expectStatus(401)
                          .toss();
                      })
                      .toss();
                  })
                  .toss();
              })
              .toss();
          })
          .toss();
      })
      .toss();
  })
  .toss();

test.create('Site cookie authentication with invalid credentials')
  .post('http://localhost:1337/_session', {name:'alice', password:'madhatter'})
  .addHeader('Content-Type', 'application/x-www-form-urlencoded')
  .expectStatus(401)
  .after(function(error, resource) {
    expect(resource.headers['set-cookie']).not.toBeDefined();
  })
  .toss();

