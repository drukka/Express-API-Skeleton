'use strict';
module.exports = (sequelize, DataTypes) => {
  const EmailActivation = sequelize.define('EmailActivation', {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false
    },
    code: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    createdAt: {
      allowNull: false,
      type: DataTypes.DATE
    },
    updatedAt: {
      allowNull: false,
      type: DataTypes.DATE
    }
  }, {
    tableName: 'EmailActivation'
  });
  EmailActivation.associate = function (models) {
    EmailActivation.belongsTo(models.User, {
      foreignKey: 'userId'
    });
  };
  return EmailActivation;
};
