const mailConfig = require('../config/mail');
const localizationConfig = require('../config/localization');

const Email = require('email-templates');
const fs = require('fs');

const email = new Email({
  message: {
    from: mailConfig.defaultMailFrom
  },
  preview: false,
  transport: {
    host: mailConfig.smptHost,
    port: mailConfig.smtpPort,
    secure: true,
    auth: {
      user: mailConfig.smtpUser,
      pass: mailConfig.smtpPassword
    }
  },
  send: true, // we want to force sending in dev/test env
  views: {
    options: {
      extensions: 'handlebars'
    }
  },
  render: (view, locals) => {
    return new Promise((resolve, reject) => {
      fs.readFile(`${__dirname}/../app/templates/${view}.hbs`, 'utf8', (err, file) => {
        if (err) reject(err);
        else {
          const handlebars = require('handlebars');
          const i18n = require('i18n');

          i18n.configure(localizationConfig);
          i18n.setLocale(locals.language);

          handlebars.registerHelper('__', (str, ...params) => {
            return i18n.__(str, ...params);
          });

          const template = handlebars.compile(file, {
            noEscape: true
          });

          email.juiceResources(template(locals)).then(html => {
            resolve(html);
          });
        }
      });
    });
  }
});

exports.send = (template, to, locals, language = 'en') => {
  locals['language'] = language;
  return email.send({
    template: template,
    message: {
      to: to
    },
    locals: locals
  }).catch(console.error);
};
