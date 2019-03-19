module.exports = {
  smptHost: process.env.SMTP_HOST,
  smtpPort: 465,
  smtpUser: process.env.SMTP_USER,
  smtpPassword: process.env.SMTP_PASSWORD,

  defaultMailFrom: 'potatofactory@example.com'
};
