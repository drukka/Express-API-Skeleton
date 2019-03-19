const fs = require('fs');
const _ = require('lodash');

const readDirRecursively = (dir) => {
  const files = fs.readdirSync(dir);
  return files.map(file => {
    const filePath = `${dir}/${file}`;
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      return readDirRecursively(filePath);
    }
    return filePath;
  });
};

exports.getFilesInDirectoryRecursively = (dir) => {
  return _.concat(...readDirRecursively(dir));
};
