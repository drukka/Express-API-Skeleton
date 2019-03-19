const app = require('../app.js');

const request = require('supertest');
const assert = require('assert');
const fs = require('fs');

/**
 * Test data
 */

const profilePicture = fs.readFileSync(`${__dirname}/../data/testProfilePicture.jpg`);
const profilePictureBase64String = Buffer.from(profilePicture).toString('base64');
const testDataFile = fs.readFileSync(`${__dirname}/../config/testData.json`);
global.test = JSON.parse(testDataFile);
global.test.profilePicture = profilePictureBase64String;

/**
 * Test cases
 */

describe('POST /user', () => {
  it('responds with user data object', done => {
    request(app)
      .post('/v1/user')
      .send(global.test.user)
      .set('Content-Type', global.test.headers['Content-Type'])
      .set('Language', global.test.headers['Language'])
      .expect(201)
      .expect('Content-Type', /json/)
      .then(response => {
        assert(response.body.id);
        assert(response.body.email, global.test.user.email);
        assert(response.body.firstname, global.test.user.firstname);
        assert(response.body.lastname, global.test.user.lastname);
        assert(response.body.profilePicture === null);
        assert(response.body.token);

        global.test.authToken = response.body.token;
        global.test.userId = response.body.id;

        done();
      })
      .catch(done);
  });

  it('handles conflicting email addresses', done => {
    request(app)
      .post('/v1/user')
      .send(global.test.user)
      .set('Content-Type', global.test.headers['Content-Type'])
      .set('Language', global.test.headers['Language'])
      .expect(409, done);
  });
});

describe('POST /user/facebook-login', () => {
  it('responds with user data object', done => {
    request(app)
      .post('/v1/user/facebook-login')
      .send(global.test.facebookUser)
      .set('Content-Type', global.test.headers['Content-Type'])
      .set('Language', global.test.headers['Language'])
      .expect(200)
      .expect('Content-Type', /json/)
      .then(response => {
        assert(response.body.id);
        assert(response.body.email, global.test.facebookUser.email);
        assert(response.body.firstname, global.test.facebookUser.firstname);
        assert(response.body.lastname, global.test.facebookUser.lastname);
        assert(response.body.profilePicture === null);
        assert(response.body.token);

        global.test.facebookUserId = response.body.id;

        done();
      })
      .catch(done);
  });

  it('logs in user', done => {
    request(app)
      .post('/v1/user/facebook-login')
      .send(global.test.facebookUser)
      .set('Content-Type', global.test.headers['Content-Type'])
      .set('Language', global.test.headers['Language'])
      .expect(200)
      .expect('Content-Type', /json/)
      .then(response => {
        assert(response.body.id);
        assert(response.body.email, global.test.facebookUser.email);
        assert(response.body.firstname, global.test.facebookUser.firstname);
        assert(response.body.lastname, global.test.facebookUser.lastname);
        assert(response.body.profilePicture === null);
        assert(response.body.token);

        global.test.facebookUserAuthToken = response.body.token;

        done();
      })
      .catch(done);
  });
});

describe('GET /user/check-auth-token', () => {
  it('returns 200 for valid authToken', done => {
    request(app)
      .get('/v1/user/check-auth-token')
      .set('Auth-Token', global.test.authToken)
      .expect(200, done);
  });

  it('returns 401 for invalid authToken', done => {
    request(app)
      .get('/v1/user/check-auth-token')
      .set('Auth-Token', 'invalidAuthToken')
      .expect(401, done);
  });
});
