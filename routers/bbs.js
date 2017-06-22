const express = require('express');
const router = express.Router();
module.exports = router;

const db = require('../db');

router.use((req,res,next) => {
  let board = res.locals.boards.find(board => board.name == req.query.board);
  if (!board) board = res.locals.boards[0];
  res.locals.board = board;
  next();
})

router.get('/', (req,res) => {
  let board = res.locals.board;
  db.query('select * from articles where board_id = ?', [board.id],
    (err, rows) => {
      if (err) throw err;

      res.render('bbs/list');
    });
});

