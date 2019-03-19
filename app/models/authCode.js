'use strict';
module.exports = (sequelize, DataTypes) => {
  const AuthCode = sequelize.define('AuthCode', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    authCode: {
      type: DataTypes.INTEGER
    },
    userId: {
      type: DataTypes.INTEGER
    },
    enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'AuthCode'
  });
  AuthCode.associate = function (models) {
    AuthCode.belongsTo(models.User, {
      foreignKey: 'userId'
    });
  };
  return AuthCode;
};
