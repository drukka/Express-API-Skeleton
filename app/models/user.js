'use strict';

const Sequelize = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false
    },
    password: {
      type: DataTypes.STRING
    },
    facebookId: {
      type: Sequelize.STRING
    },
    firstname: {
      type: DataTypes.STRING,
      allowNull: false
    },
    lastname: {
      type: DataTypes.STRING,
      allowNull: false
    },
    profilePicture: {
      type: DataTypes.STRING
    },
    language: {
      type: DataTypes.ENUM('hu', 'en')
    },
    enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'User'
  });
  User.associate = function (models) {
    User.hasMany(models.PasswordResetCode, {
      foreignKey: 'userId'
    });

    User.hasOne(models.EmailActivation, {
      foreignKey: 'userId'
    });

    User.hasMany(models.AuthCode, {
      foreignKey: 'userId'
    });

    User.belongsTo(models.UserRole, {
      foreignKey: 'roleId'
    });
  };
  return User;
};
