const crypto = require('crypto');
const moment = require('moment');
const fs = require('fs');

/**
 * Here you can set the destination for specific fieldNames.
 */
const destination = {
  profilePicture: `${__dirname}/../uploads/profilePictures`
};

const writeFileFromBase64String = (destination, filename, base64Data) => {
  return new Promise((resolve, reject) => {
    fs.writeFile(`${destination}/${filename}`, base64Data, 'base64', (err) => {
      if (err) {
        console.error(err);
        return reject(err);
      }

      resolve(filename);
    });
  });
};

exports.handle = (fileFieldName, extension) => {
  return (req, res, next) => {
    const data = Array.isArray(req.body[fileFieldName]) ? req.body[fileFieldName] : [req.body[fileFieldName]];

    const promises = data.map(fileData => {
      const fileParts = fileData.split(',');
      const base64Data = fileParts[fileParts.length - 1];

      const filename = crypto.createHash('sha256').update(`${res.locals.currentUser.id}${Math.random()}${moment().unix()}`).digest('hex');
      return writeFileFromBase64String(destination[fileFieldName], `${filename}.${extension}`, base64Data);
    });

    Promise.all(promises).then(values => {
      req.uploadedFiles = values;
      next();
    }).catch(() => {
      res.sendStatus(500);
    });
  };
};
