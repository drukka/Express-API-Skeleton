const app = require('../app.js');

const request = require('supertest');
const assert = require('assert');
const fs = require('fs');

/**
 * Test cases
 */

describe('POST /user/login', () => {
  it('handles bad password', done => {
    request(app)
      .post('/v1/user/login')
      .send({
        email: global.test.user.email,
        password: 'bad password'
      })
      .set('Content-Type', global.test.headers['Content-Type'])
      .expect(401, done);
  });

  it('responds with user data object and token', done => {
    request(app)
      .post('/v1/user/login')
      .send({
        email: global.test.user.email,
        password: global.test.user.password
      })
      .set('Content-Type', global.test.headers['Content-Type'])
      .expect(200)
      .expect('Content-Type', /json/)
      .then(response => {
        assert(response.body.id);
        assert(response.body.email, global.test.user.email);
        assert(response.body.firstname, global.test.user.firstname);
        assert(response.body.lastname, global.test.user.lastname);
        assert(response.body.profilePicture === null);
        assert(response.body.token);

        global.test.authToken = response.body.token;

        done();
      })
      .catch(done);
  });
});

describe('POST /user/profile-picture', () => {
  it('saves profile picture', done => {
    request(app)
      .post('/v1/user/profile-picture')
      .send({
        profilePicture: global.test.profilePicture
      })
      .set('Auth-Token', global.test.authToken)
      .set('Content-Type', global.test.headers['Content-Type'])
      .expect(201, done);
  });

  it('returns profile picture url in user response', done => {
    request(app)
      .get('/v1/user')
      .set('Auth-Token', global.test.authToken)
      .set('Content-Type', global.test.headers['Content-Type'])
      .expect(200)
      .expect('Content-Type', /json/)
      .then(response => {
        assert(response.body.id);
        assert(response.body.email, global.test.user.email);
        assert(response.body.firstname, global.test.user.firstname);
        assert(response.body.lastname, global.test.user.lastname);
        assert(response.body.profilePicture !== null);

        const profilePictureUrlParts = response.body.profilePicture.split('/');
        global.test.filenames.push(profilePictureUrlParts[profilePictureUrlParts.length - 1]);

        assert(fs.existsSync(`${__dirname}/../uploads/profilePictures/${global.test.filenames[global.test.filenames.length - 1]}`));

        done();
      })
      .catch(done);
  });

  describe('DELETE /user/profile-picture', () => {
    it('deletes profile picture', done => {
      request(app)
        .delete('/v1/user/profile-picture')
        .set('Auth-Token', global.test.authToken)
        .expect(200, done);
    });

    it('returns null for profile picture url in user response', done => {
      request(app)
        .get('/v1/user')
        .set('Auth-Token', global.test.authToken)
        .set('Content-Type', global.test.headers['Content-Type'])
        .expect(200)
        .expect('Content-Type', /json/)
        .then(response => {
          assert(response.body.id);
          assert(response.body.email, global.test.user.email);
          assert(response.body.firstname, global.test.user.firstname);
          assert(response.body.lastname, global.test.user.lastname);
          assert(response.body.profilePicture === null);

          done();
        })
        .catch(done);
    });
  });
});

describe('GET /user', () => {
  it('gets user data object', done => {
    request(app)
      .get('/v1/user')
      .set('Auth-Token', global.test.authToken)
      .set('Content-Type', global.test.headers['Content-Type'])
      .expect(200)
      .expect('Content-Type', /json/)
      .then(response => {
        assert(response.body.id);
        assert(response.body.email, global.test.user.email);
        assert(response.body.firstname, global.test.user.firstname);
        assert(response.body.lastname, global.test.user.lastname);
        assert(response.body.profilePicture === null);

        done();
      })
      .catch(done);
  });
});

describe('PUT /user/change-password', () => {
  it('returns 200', done => {
    request(app)
      .put('/v1/user/change-password')
      .send({
        oldPassword: global.test.user.password,
        newPassword: global.test.updatedUser.password
      })
      .set('Auth-Token', global.test.authToken)
      .set('Content-Type', global.test.headers['Content-Type'])
      .expect(200, done);
  });

  it('logs in with new password', done => {
    request(app)
      .post('/v1/user/login')
      .send({
        email: global.test.user.email,
        password: global.test.updatedUser.password
      })
      .set('Content-Type', global.test.headers['Content-Type'])
      .expect(200)
      .expect('Content-Type', /json/)
      .then(response => {
        assert(response.body.id);
        assert(response.body.email, global.test.user.email);
        assert(response.body.firstname, global.test.user.firstname);
        assert(response.body.lastname, global.test.user.lastname);
        assert(response.body.profilePicture === null);
        assert(response.body.token);

        global.test.authToken = response.body.token;

        done();
      })
      .catch(done);
  });
});

describe('PUT /user', () => {
  it('updates user data', done => {
    request(app)
      .put('/v1/user')
      .send({
        firstname: global.test.updatedUser.firstname,
        lastname: global.test.updatedUser.lastname
      })
      .set('Auth-Token', global.test.authToken)
      .set('Content-Type', global.test.headers['Content-Type'])
      .expect(200)
      .expect('Content-Type', /json/)
      .then(response => {
        assert(response.body.id);
        assert(response.body.firstname, global.test.updatedUser.firstname);
        assert(response.body.lastname, global.test.updatedUser.lastname);
        assert(response.body.profilePicture === null);

        done();
      })
      .catch(done);
  });
});

describe('PUT /user/language', () => {
  it('updates user language', done => {
    request(app)
      .put('/v1/user/language')
      .set('Auth-Token', global.test.authToken)
      .set('Language', 'en')
      .set('Content-Type', global.test.headers['Content-Type'])
      .expect(200, done);
  });
});

describe('POST /user/logout', () => {
  it('retuns 200', done => {
    request(app)
      .post('/v1/user/logout')
      .set('Auth-Token', global.test.authToken)
      .set('Content-Type', global.test.headers['Content-Type'])
      .expect(200, done);
  });

  it('invalidates auth token', done => {
    request(app)
      .get('/v1/user')
      .set('Auth-Token', global.test.authToken)
      .set('Content-Type', global.test.headers['Content-Type'])
      .expect(401, done);
  });
});
