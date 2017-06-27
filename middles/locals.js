const db = require('../db');

module.exports = (req,res,next) => {
  res.locals.user = req.session.user || null;
  res.locals.path = req.path;
  res.locals.query = req.query;
  res.locals.forms = {};

  // querystring builder
  res.locals.buildQuery = (obj = {}) => {
    let query = {};
    for(let k in req.query) query[k] = req.query[k];
    for(let k in obj) {
      if (obj[k] == null) delete query[k];
      else query[k] = obj[k];
    }
  
    let tokens = [];
    for(let k in query) tokens.push(`${k}=${encodeURIComponent(query[k])}`);
    return tokens.length == 0 ? "" : "?" + tokens.join("&");
  };

  res.locals.buildHiddens = (obj = {}) => {
    let query = {};
    for(let k in req.query) query[k] = req.query[k];
    for(let k in obj) {
      if (obj[k] == null) delete query[k];
      else query[k] = obj[k];
    }
  
    let inputs = [];
    for(let k in query) inputs.push(`<input type="hidden" name="${k}" value="${query[k]}">`);
    return inputs.join("\n");
  }

  db.query('select * from boards', (err, rows) => {
    if (err) return next(err);
    res.locals.boards = rows;
    next();
  });
};