const db = require('../db');

module.exports = (req,res,next) => {
  res.locals.user = req.session.user || null;
  res.locals.path = req.path;
  res.locals.forms = {};

  // querystring maker
  res.locals.query = (obj = {}) => {
    let query = req.query;
    let resultQuery = {};
    
    // copy
    for(let key in query) {
      resultQuery[key] = query[key];
    }

    // overwrite
    for(let key in obj) {
      resultQuery[key] = obj[key];
    }
    
    // convert to string
    let strings = [];
    for(let key in resultQuery) {
      strings.push(`${key}=${resultQuery[key]}`);
    }
    return strings.length == 0 ? "" : `?${strings.join("&")}`;
  };

  db.query('select * from boards', (err, rows) => {
    if (err) return next(err);
    res.locals.boards = rows;
    next();
  });
};