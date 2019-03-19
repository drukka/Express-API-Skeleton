const swaggerTools = require('swagger-tools');
const jsonMerger = require('json-merger');

const userController = require('../app/controllers/v1/userController');
const fileUpload = require('./fileUploadMiddleware');
const swaggerToolsOptions = require('../config/apiVersions');
const dirHelper = require('./dir');

// ensuring there are no parameters that aren't defined in swagger file because of db reserved keywords
const throwErrorOnUnknownBodyParameters = exports.throwErrorOnUnknownBodyParameters = () => {
  return (req, res, next) => {
    let allowedProperties = {};
    if (req.swagger && req.swagger.params.body && req.swagger.params.body.schema.schema.properties) {
      allowedProperties = req.swagger.params.body.schema.schema.properties;
    }

    const properties = Object.keys(req.body);
    properties.forEach(property => {
      if (!allowedProperties[property]) {
        res.statusCode = 400;
        return next(new Error());
      }
    });

    next();
  };
};

const authenticateUser = () => {
  return (req, res, next) => {
    if (req.swagger && req.swagger.operation['x-auth-required']) {
      return userController.authRequired(req, res, next);
    }

    next();
  };
};

const checkUserRole = () => {
  return (req, res, next) => {
    if (req.swagger && req.swagger.operation['x-min-role']) {
      const mw = userController.userRoleRequired(req.swagger.operation['x-min-role']);
      return mw(req, res, next);
    }

    next();
  };
};

// it creates req.pathParams object with path parameters
const populateRequestParams = () => {
  return (req, res, next) => {
    req.pathParams = {};
    if (req.swagger) {
      for (let param in req.swagger.params) {
        if (req.swagger.params[param].schema.in === 'path') {
          req.pathParams[param] = req.swagger.params[param].value;
        }
      }
    }

    next();
  };
};

// saves file(s) and creates req.uploadedFiles object with file details
const handleFileUpload = () => {
  return (req, res, next) => {
    if (req.swagger && req.swagger.params.body && req.swagger.params.body.schema.schema.properties) {
      const properties = req.swagger.params.body.schema.schema.properties;
      for (let key in properties) {
        if (properties[key]['x-base64-file'] && properties[key]['x-file-extension']) {
          const mw = fileUpload.handle(key, properties[key]['x-file-extension']);
          return mw(req, res, next);
        }
      }
    }

    next();
  };
};

const trimStrings = () => {
  return (req, res, next) => {
    if (req.swagger && req.swagger.params.body && req.swagger.params.body.schema.schema.properties) {
      const properties = req.swagger.params.body.schema.schema.properties;
      for (let key in properties) {
        if ((properties[key].type === 'string' || (Array.isArray(properties[key].type) && properties[key].type.indexOf('string') >= 0)) && properties[key]['x-trim'] && req.body[key]) {
          req.body[key] = req.body[key].trim();
        }
      }
    }

    next();
  };
};

exports.initialize = (version = '/v1') => new Promise((resolve, reject) => {
  const dir = `${__dirname}/../config/swagger${version}`;

  const paths = jsonMerger.mergeFiles(dirHelper.getFilesInDirectoryRecursively(`${dir}/paths`));
  const definitions = jsonMerger.mergeFiles(dirHelper.getFilesInDirectoryRecursively(`${dir}/definitions`));
  const info = jsonMerger.mergeFile(`${dir}/swagger.json`);

  const swagger = jsonMerger.mergeObjects([info, { paths }, { definitions }]);

  swaggerTools.initializeMiddleware(swagger, function (middleware) {
    const middlewares = [
      // Interpret Swagger resources and attach metadata to request - must be first in swagger-tools middleware chain
      middleware.swaggerMetadata(),

      // Validate Swagger requests
      middleware.swaggerValidator(),

      populateRequestParams(),

      throwErrorOnUnknownBodyParameters(),

      trimStrings(),

      authenticateUser(),

      checkUserRole(),

      handleFileUpload(),

      // Route validated requests to appropriate controller
      middleware.swaggerRouter(swaggerToolsOptions[version]),

      // Serve the Swagger documents and Swagger UI
      middleware.swaggerUi()
    ];

    resolve(middlewares);
  });
});
