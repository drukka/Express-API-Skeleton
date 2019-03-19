require('dotenv').load();

const express = require('express');
const app = express();
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const mung = require('express-mung');

const swaggerMiddleware = require('./helpers/swaggerMiddleware');
const apiVersionSettings = require('./config/apiVersions');
const html = require('./helpers/htmlEscape');

const port = process.env.PORT || 8000;

/**
 * Define available API versions here
 */
const apiVersions = Object.keys(apiVersionSettings);

Promise.all(apiVersions.map(swaggerMiddleware.initialize)).then(middlewares => {
  app.use(helmet());
  app.use(cors());

  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json({ limit: 40 * 1024 * 1024 })); // 40 MB
  app.use(html.escape());
  app.use(morgan('dev'));
  app.use(mung.json(html.deescape()));

  for (let i in middlewares) {
    app.use(...middlewares[i]);
  }

  app.use('/uploads', express.static('uploads'));

  app.use((err, req, res, next) => {
    if (process.env.NODE_ENV === 'development') {
      console.error(err);
    }

    if (!res.headersSent) {
      res.sendStatus(res.statusCode !== 200 ? res.statusCode : 400);
    }
  });

  app.listen(port, 'localhost', () => {
    console.log(`Server listening on port ${port}`);
  });
}).catch(console.error);

module.exports = app;
