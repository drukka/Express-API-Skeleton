'use strict';
module.exports = (sequelize, DataTypes) => {
  const PasswordResetCode = sequelize.define('PasswordResetCode', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    code: {
      type: DataTypes.INTEGER
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'PasswordResetCode'
  });
  PasswordResetCode.associate = function (models) {
    PasswordResetCode.belongsTo(models.User, {
      foreignKey: 'userId'
    });
  };
  return PasswordResetCode;
};
