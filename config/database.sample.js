module.exports = {
  development: {
    username: 'root',
    password: '1234',
    database: 'skeleton',
    operatorsAliases: false,
    host: '127.0.0.1',
    dialect: 'mysql',
    define: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_general_ci'
    }
  },
  test: {
    username: '',
    password: null,
    database: '',
    host: '127.0.0.1',
    dialect: 'mysql'
  },
  production: {
    username: '',
    password: null,
    database: '',
    host: '127.0.0.1',
    dialect: 'mysql'
  }
};
