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
  let page = Math.max(1, parseInt(req.query.page || 1));
  let nPage = 5;
  let nBlock = 2;
  let search = (req.query.search || '').trim();

  let query1, params1, query2, params2;
  if (search != '') {
    search = '%'+search+'%';
    query1 = `
      select a.id, a.title, a.createdAt, a.hit, u.name author
      from articles a left join users u on a.user_id = u.id
      where board_id = ? and a.title like ?
      order by id desc
      limit ?, ?
      `;
    params1 = [board.id, search, (page-1)*nPage, nPage];
    query2 = `select count(*) as count from articles where board_id = ? and title like ?`;
    params2 = [board.id, search];
  } else {
    query1 = `
      select a.id, a.title, a.createdAt, a.hit, u.name author
      from articles a left join users u on a.user_id = u.id
      where board_id = ?
      order by id desc
      limit ?, ?
      `;
    params1 = [board.id, (page-1)*nPage, nPage];
    query2 = `select count(*) as count from articles where board_id = ?`;
    params2 = [board.id];
  }

  db.query(query1, params1, (err, rows) => {
      if (err) throw err;

      // pagination
      db.query(query2, params2, (err, results) => {
        if (err) throw err;

        let itemTotal = results[0].count;
        let pTotal = Math.ceil(itemTotal / nPage);
        let bTotal = Math.ceil(pTotal / nBlock);
        let cBlock = Math.ceil(page/nBlock);
        let paging = {
          current: page,
          prev: cBlock > 1 ? page - 1 : null,
          next: cBlock < bTotal ? cBlock * nBlock + 1 : null,
          first: cBlock > 1 ? 1 : null,
          last: cBlock < bTotal ? pTotal : null,
          start: (cBlock-1)*nBlock + 1,
          end: cBlock >= bTotal ? pTotal : cBlock*nBlock,
        };
        if (paging.first == paging.prev) paging.prev = null;
        if (paging.last == paging.next) paging.next = null;

        res.render('bbs/list', {
          articles: rows,
          paging
        });
      });
    });
});

