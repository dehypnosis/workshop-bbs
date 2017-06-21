const db = require('../db');

module.exports = (req,res,next) => {
  res.locals.user = req.session.user || null;
  res.locals.path = req.path;
  res.locals.forms = {};
  db.query('select * from boards', (err, rows) => {
    if (err) return next(err);
    res.locals.boards = rows;
    next();
  });
};