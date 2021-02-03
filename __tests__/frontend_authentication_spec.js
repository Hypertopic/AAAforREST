const frisby = require('frisby');
const joi = frisby.Joi;

const APP_HOST = process.env.APP_HOST || 'http://localhost:1337';

const schema = joi.object().keys({
  ok: joi.boolean().required(), 
  name: joi.string()}
);

it('authenticates with HTTP basic authentication', () => frisby
  .post(`${APP_HOST}/`, {
    body: {},
    headers: new Headers({
      'Authorization': 'Basic ' + Buffer.from('alice:whiterabbit').toString('base64'), 
      'Content-Type': 'application/json'
    })
  })
  .expect('status', 201)
);

it('authenticates with HTTP cookie if credentials are valid', () => frisby
  .get(`${APP_HOST}/_session`)
  .expect('status', 200)
  .expect('jsonTypes', schema.forbiddenKeys('name'))
  .then(() => frisby
    .post(`${APP_HOST}/_session`, {name:'alice', password:'whiterabbit'})
    .expect('status', 200)
  )
  .then(function(resource) {
    let cookie = resource.headers.get('set-cookie');
    return frisby.get(`${APP_HOST}/_session`, {headers:{cookie}})
      .expect('status', 200)
      .expect('json', 'name', 'alice')
      .then(() => frisby
        .post(`${APP_HOST}/`, {body:{}, headers:{cookie}})
        .expect('status', 201)
      )
      .then(() => frisby
        .delete(`${APP_HOST}/_session`, {headers:{cookie}})
        .expect('status', 200)
      )
      .then(() => frisby
        .get(`${APP_HOST}/_session`, {headers:{cookie}})
        .expect('jsonTypes', schema.forbiddenKeys('name'))
      )
      .then(() => frisby
        .post(`${APP_HOST}/`, {body:{}, headers:{cookie}})
        .expect('status', 401)
      )
  })
);

it('does not authenticate with HTTP cookie if credentials are invalid', () => frisby
  .post(`${APP_HOST}/_session`, {name:'alice', password:'madhatter'})
  .expect('status', 401)
  .then((resource) => expect(resource.headers.get('set-cookie')).toBeNull())
);
