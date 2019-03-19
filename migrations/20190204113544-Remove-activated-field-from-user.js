'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('User', 'activated');
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('User',
      'activated',
      {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      });
  }
};
