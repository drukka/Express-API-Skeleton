const { User, PasswordResetCode, AuthCode, EmailActivation } = require('../../models');
const encryptConfig = require('../../../config/encrypt');
const companyConfig = require('../../../config/company');
const email = require('../../../helpers/email');
const promiseError = require('../../../helpers/promiseErrorHandler');
const HTTPError = require('../../../helpers/httpError');

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const moment = require('moment');

/**
 * helpers
 */
const countUsersWithEmail = (email) => {
  return User.count({
    where: {
      email: email
    }
  });
};

const userDataResponse = (user, token) => {
  const userRoles = {
    10: 'user',
    20: 'admin',
    30: 'superAdmin'
  };

  return {
    id: user.id,
    email: user.email,
    firstname: user.firstname,
    lastname: user.lastname,
    profilePicture: user.profilePicture ? `${companyConfig.fileStorageUrl}${companyConfig.profilePictureEndpoint}/${user.profilePicture}` : null,
    language: user.language,
    token: token,
    activated: user.activated,
    role: userRoles[user.roleId]
  };
};

const findUserByEmail = (email, includes = []) => {
  return User.findOne({
    include: includes,
    where: {
      email: email
    }
  });
};

const findUserByfacebookId = (facebookId, includes = []) => {
  return User.findOne({
    include: includes,
    where: {
      facebookId: facebookId
    }
  });
};

const findUserById = exports.findUserById = (id, includes = []) => {
  return User.findOne({
    include: includes,
    where: {
      id: id
    }
  });
};

const findUserByIdWithAuth = (userId, authCode) => {
  return User.findOne({
    include: [{
      model: AuthCode,
      where: {
        authCode: authCode
      }
    }],
    where: {
      id: userId
    }
  });
};

const findAuthCode = (userId, authCode) => {
  return AuthCode.findOne({
    where: {
      userId,
      authCode
    }
  });
};

const createUser = (data) => {
  return new Promise(resolve => {
    User.create(data).then(user => {
      createEmailActivation(user.id, user.email).then(code => {
        return sendActivationEmailToUser(user, code);
      }).catch(console.error);

      return createAuthToken(user);
    }).then(resolve);
  });
};

const createAuthToken = (user) => {
  const { token, authCode } = generateJWTAuthToken(user.id);

  return createAuthCode(user, authCode).then(() => {
    return userDataResponse(user, token);
  });
};

const createAuthCode = (user, authCode) => {
  return user.createAuthCode({
    authCode: authCode
  });
};

const generateJWTAuthToken = (id) => {
  const authCode = randomNumber(8);
  const token = generateJWTToken({
    id,
    authCode
  });

  return {
    token,
    authCode
  };
};

const generateJWTToken = (data) => {
  data['iss'] = companyConfig.companyName;
  const token = jwt.sign(data, encryptConfig.jwtSecret);

  return token;
};

const verifyJWTToken = (token) => {
  return new Promise(resolve => {
    jwt.verify(token, encryptConfig.jwtSecret, (err, decoded) => {
      if (err) {
        resolve({ error: err, decoded: null });
      } else {
        resolve({ error: null, decoded: decoded });
      }
    });
  });
};

const randomNumber = (power = 4) => {
  return Math.floor(Math.random() * Math.pow(10, power));
};

const savePasswordResetCode = (user, code, expiresAt) => {
  return user.createPasswordResetCode({
    code: code,
    expiresAt: expiresAt
  });
};

const findUserByIdWithPasswordRecoveryCode = (userId, code) => {
  return User.findOne({
    include: [{
      model: PasswordResetCode,
      where: {
        code: code
      }
    }],
    where: {
      id: userId
    }
  });
};

const sendActivationEmailToUser = (user, code, newEmail = null) => {
  const token = generateJWTToken({
    id: user.id,
    exp: moment().add(24, 'hours').unix(),
    code: code
  });

  const activationUrl = `${companyConfig.siteUrl}${companyConfig.userActivationEndpoint}?token=${token}`;

  const receiver = newEmail || user.email;

  return email.send('activation', receiver, {
    name: user.firstname,
    activationUrl: activationUrl
  }, user.language);
};

const createEmailActivation = (userId, email) => {
  const code = randomNumber(8);
  return EmailActivation.upsert({
    userId,
    email,
    code
  }).then(() => {
    return code;
  });
};

const getEmailActivationProcess = (user) => {
  return EmailActivation.findOne({
    where: {
      userId: user.id
    }
  });
};

const updateUserPassword = (user, newPassword) => {
  return new Promise(resolve => {
    bcrypt.hash(newPassword, encryptConfig.saltRounds).then(hash => {
      user.password = hash;
      user.save().then(user => {
        resolve(user);
      });
    });
  });
};

const updateProfilePictureName = (user, pictureName) => {
  user.profilePicture = pictureName;
  return user.save();
};

const validatePassword = (user, password) => {
  return new Promise((resolve, reject) => {
    bcrypt.compare(password, user.password, function (err, valid) {
      if (err) {
        reject(err);
      }

      resolve(valid);
    });
  });
};

/**
 * controllers
 */
exports.register = (req, res) => {
  countUsersWithEmail(req.body.email).then(count => {
    if (count > 0) {
      return Promise.reject(new HTTPError(409));
    }

    req.body['language'] = req.headers['language'];

    return bcrypt.hash(req.body.password, encryptConfig.saltRounds);
  }).then(hash => {
    req.body['password'] = hash;
    return createUser(req.body);
  }).then(response => {
    res.status(201).json(response);
  }).catch(promiseError.handle(res));
};

exports.login = (req, res) => {
  findUserByEmail(req.body.email).then(user => {
    if (!user) {
      return Promise.reject(new HTTPError(401));
    }

    return validatePassword(user, req.body.password).then(valid => {
      if (!valid) {
        return Promise.reject(new HTTPError(401));
      }

      return createAuthToken(user);
    });
  }).then(response => {
    res.json(response);
  }).catch(promiseError.handle(res));
};

exports.logout = (req, res) => {
  findAuthCode(res.locals.currentUser.id, res.locals.currentAuthCode).then(authCode => {
    return authCode.destroy();
  }).then(() => {
    return res.sendStatus(200);
  }).catch(promiseError.handle(res));
};

exports.getUser = (req, res) => {
  findUserById(res.locals.currentUser.id).then(user => {
    res.json(userDataResponse(user));
  }).catch(promiseError.handle(res));
};

exports.authRequired = (req, res, next) => {
  verifyJWTToken(req.headers['auth-token']).then(response => {
    const { error, decoded } = response;

    if (error) {
      return Promise.reject(new HTTPError(401));
    }

    return findUserByIdWithAuth(decoded.id, decoded.authCode);
  }).then(user => {
    if (!user) {
      return Promise.reject(new HTTPError(401));
    }

    res.locals.currentUser = user;
    res.locals.currentAuthCode = user.AuthCodes[0].authCode;

    next();
  }).catch(promiseError.handle(res));
};

/**
 * Returns a middleware to check authentication for different roles (like admin)
 */
exports.userRoleRequired = (role) => {
  return (req, res, next) => {
    if (res.locals.currentUser.roleId < role) {
      return res.sendStatus(403);
    }

    next();
  };
};

/**
 * Checks if Auth-Token is still valid
 */
exports.checkAuthToken = (req, res) => {
  res.sendStatus(200);
};

exports.updateUser = (req, res) => {
  findUserByEmail(req.body.email).then(user => {
    if (user && req.body.email !== res.locals.currentUser.email) {
      return Promise.reject(new HTTPError(409));
    }

    return res.locals.currentUser.update(req.body);
  }).then(user => {
    res.json(userDataResponse(user));
  }).catch(promiseError.handle(res));
};

exports.sendActivationEmail = (req, res) => {
  getEmailActivationProcess(res.locals.currentUser).then(emailActivation => {
    if (!emailActivation) {
      return Promise.reject(new HTTPError(409));
    }

    return createEmailActivation(res.locals.currentUser.id, emailActivation.email).then(code => {
      return sendActivationEmailToUser(res.locals.currentUser, code, emailActivation.email);
    });
  }).then(() => {
    res.sendStatus(200);
  }).catch(promiseError.handle(res));
};

exports.activateEmailAddress = (req, res) => {
  verifyJWTToken(req.body.token).then(response => {
    const { error, decoded } = response;

    if (error) {
      return Promise.reject(new HTTPError(401));
    }

    return findUserById(decoded.id, [EmailActivation]).then(user => {
      if (!user || !user.EmailActivation || user.EmailActivation.code !== decoded.code) {
        return Promise.reject(new HTTPError(401));
      }

      return findUserByEmail(user.EmailActivation.email).then(userWithSameEmail => {
        if (userWithSameEmail && user.id !== userWithSameEmail.id) {
          return Promise.reject(new HTTPError(409));
        }

        user.email = user.EmailActivation.email;
        return user.EmailActivation.destroy().then(() => {
          return user.save();
        });
      });
    });
  }).then(() => {
    res.sendStatus(200);
  }).catch(promiseError.handle(res));
};

exports.sendPasswordRecoveryEmail = (req, res) => {
  findUserByEmail(req.body.email).then(user => {
    if (!user) {
      return Promise.reject(new HTTPError(404));
    }

    const code = randomNumber(8);
    const expiresAt = moment().add(1, 'hours');
    const token = generateJWTToken({
      id: user.id,
      exp: expiresAt.unix(),
      code: code
    });

    return savePasswordResetCode(user, code, expiresAt).then(() => {
      const passwordResetUrl = `${companyConfig.siteUrl}${companyConfig.resetPasswordEndpoint}?token=${token}`;

      return email.send('passwordReset', user.email, {
        name: user.firstname,
        passwordResetUrl: passwordResetUrl
      }, user.language);
    });
  }).then(() => {
    res.sendStatus(200);
  }).catch(promiseError.handle(res));
};

exports.changePassword = (req, res) => {
  // social account
  if (!res.locals.currentUser.password) {
    return res.sendStatus(403);
  }

  validatePassword(res.locals.currentUser, req.body.oldPassword).then(valid => {
    if (!valid) {
      return Promise.reject(new HTTPError(406));
    }

    return updateUserPassword(res.locals.currentUser, req.body.newPassword);
  }).then(() => {
    res.sendStatus(200);
  }).catch(promiseError.handle(res));
};

exports.changeEmail = (req, res) => {
  findUserByEmail(req.body.email).then(user => {
    if (req.body.email === res.locals.currentUser.email) {
      return Promise.reject(new HTTPError(406));
    }

    if (user) {
      return Promise.reject(new HTTPError(409));
    }

    return createEmailActivation(res.locals.currentUser.id, req.body.email).then(code => {
      return sendActivationEmailToUser(res.locals.currentUser, code, req.body.email);
    });
  }).then(() => {
    return res.sendStatus(200);
  }).catch(promiseError.handle(res));
};

exports.resetPassword = (req, res) => {
  verifyJWTToken(req.body.token).then(response => {
    const { error, decoded } = response;

    if (error) {
      return Promise.reject(new HTTPError(401));
    }

    return findUserByIdWithPasswordRecoveryCode(decoded.id, decoded.code);
  }).then(user => {
    if (!user) {
      return Promise.reject(new HTTPError(401));
    }

    return updateUserPassword(user, req.body.newPassword).then(() => {
      return user.PasswordResetCodes[0].destroy();
    });
  }).then(() => {
    res.sendStatus(200);
  }).catch(promiseError.handle(res));
};

exports.facebookLogin = (req, res) => {
  findUserByfacebookId(req.body.facebookId).then(user => {
    if (!user) {
      return findUserByEmail(req.body.email).then(userByEmail => {
        if (userByEmail) {
          return Promise.reject(new HTTPError(409));
        }

        return createUser(req.body);
      });
    }

    return createAuthToken(user, req.headers);
  }).then(response => {
    res.json(response);
  }).catch(promiseError.handle(res));
};

exports.uploadProfilePicture = (req, res) => {
  updateProfilePictureName(res.locals.currentUser, req.uploadedFiles[0]).then(() => {
    res.sendStatus(201);
  }).catch(promiseError.handle(res));
};

exports.deleteProfilePicture = (req, res) => {
  updateProfilePictureName(res.locals.currentUser, null).then(() => {
    res.sendStatus(200);
  }).catch(promiseError.handle(res));
};

exports.makeUserAdmin = (req, res) => {
  findUserById(req.pathParams.userId).then(user => {
    if (!user) {
      return Promise.reject(new HTTPError(404));
    }

    if (user.id === res.locals.currentUser.id) {
      return Promise.reject(new HTTPError(403));
    }

    user.roleId = 20;
    return user.save();
  }).then(() => {
    res.sendStatus(200);
  }).catch(promiseError.handle(res));
};

exports.removeAdminPermissions = (req, res) => {
  findUserById(req.pathParams.userId).then(user => {
    if (!user) {
      return Promise.reject(new HTTPError(404));
    }

    user.roleId = 10;
    return user.save();
  }).then(() => {
    res.sendStatus(200);
  }).catch(promiseError.handle(res));
};

exports.updateLanguage = (req, res) => {
  res.locals.currentUser.language = req.headers.language;
  res.locals.currentUser.save().then(() => {
    res.sendStatus(200);
  }).catch(promiseError.handle(res));
};
