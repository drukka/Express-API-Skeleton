'use strict';

const fs = require('fs');
const now = new Date();

const content = fs.readFileSync(`${__dirname}/../data/userRole.json`);
let data = JSON.parse(content);

data = data.map(elem => {
  elem['createdAt'] = now;
  elem['updatedAt'] = now;
  return elem;
});

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('UserRole', data);
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('UserRole', null);
  }
};
