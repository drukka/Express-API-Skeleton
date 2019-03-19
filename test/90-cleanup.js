const userController = require('../app/controllers/v1/userController');

const fs = require('fs');

const cleanDbAfterUser = (user) => {
  return new Promise(resolve => {
    user.getAuthCodes()
      .then(authCodes => Promise.all(authCodes.map(authCode => authCode.destroy())))
      .then(() => user.getEmailActivation())
      .then(emailActivation => emailActivation.destroy())
      .then(() => {
        resolve(user);
      });
  });
};

after(() => {
  global.test.filenames.forEach(file => {
    if (fs.existsSync(`${__dirname}/../uploads/contracts/${file}`)) {
      fs.unlinkSync(`${__dirname}/../uploads/contracts/${file}`);
    }
  });

  userController.findUserById(global.test.userId).then(user => {
    return cleanDbAfterUser(user);
  }).then(user => {
    return user.destroy();
  }).then(() => {
    return userController.findUserById(global.test.facebookUserId);
  }).then(user => {
    return cleanDbAfterUser(user);
  }).then(user => {
    return user.destroy();
  }).then(() => {
    process.exit(0);
  });
});
