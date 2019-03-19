const regex = {
  'escape': /[&<>"']/g,
  'deescape': /&(amp|lt|gt|quot|#039);/g
};

const map = {
  'escape': {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  },
  'deescape': {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#039;': "'"
  }
};

const replaceChars = (text, type) => {
  return text.toString().replace(regex[type], function (m) {
    return map[type][m];
  });
};

const replaceHTMLCharsInObject = (target, type, exclude = []) => {
  if (typeof target === 'string') {
    target = replaceChars(target, type);
  } else if (typeof target === 'object') {
    for (let key in target) {
      if (!exclude || exclude.indexOf(key) < 0) {
        target[key] = replaceHTMLCharsInObject(target[key], type);
      }
    }
  }

  return target;
};

exports.escape = (options = {}) => {
  return (req, res, next) => {
    replaceHTMLCharsInObject(req.body, 'escape', options.exclude);
    next();
  };
};

exports.deescape = () => {
  return (body, req, res) => {
    replaceHTMLCharsInObject(body, 'deescape');
  };
};
