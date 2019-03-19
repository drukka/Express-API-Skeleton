const HTTPError = require('./httpError');

exports.handle = (res) => {
  return (err) => {
    if (err instanceof HTTPError) {
      return res.sendStatus(err.getErrorCode());
    }

    console.error(err);
    res.sendStatus(500);
  };
};
