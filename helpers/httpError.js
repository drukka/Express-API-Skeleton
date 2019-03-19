class HTTPError extends Error {
  constructor (errorCode) {
    super();
    this.errorCode = errorCode;
  }

  getErrorCode () {
    return this.errorCode;
  }
}

module.exports = HTTPError;
