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

        // read article
        let id = req.query.id;
        if (id) {
          db.query(`select a.*, u.name author from articles a left join users u on a.user_id = u.id where a.id = ?`, [id], (err, articleRows) => {
            if (err) throw err;

            let article = articleRows[0];
            if (!article) {
              return res.render('bbs/list', {
                articles: rows,
                paging,
                article: null,
                comments: null
              });
            }

            // hit article
            if (!req.session.hits) {
              req.session.hits = [];
            }
            if (req.session.hits.indexOf(article.id) == -1) {
              db.query(`update articles set hit = hit+1 where id = ?`, [id]);
              req.session.hits.push(article.id);
            }

            // get comments
            db.query(`select c.*, u.name author from comments c join users u on u.id = c.user_id where article_id = ?`, [article.id],
              (err, comments) => {
                if (err) throw err;

                res.render('bbs/list', {
                  articles: rows,
                  paging,
                  article,
                  comments
                });
              });
          });
        } else {
          res.render('bbs/list', {
            articles: rows,
            paging,
            article: null
          });
        }


      });
    });
});

router.get('/write', (req,res) => {
  if (!req.session.user) return res.redirect('/user/login');
  res.render('bbs/write', {article:{}});
});

router.post('/write', (req,res) => {
  let boardName = req.query.board;
  let board = res.locals.boards.find(b => b.name == boardName);
  let user = req.session.user;
  let title = (req.body.title || '').trim();
  let content = (req.body.content || '').trim();

  if (!board || !user || !title || !content) return res.status(400).end();

  db.query(`insert into articles (board_id, user_id, title, content) values (?, ?, ?, ?)`,
    [board.id, user.id, title, content],
    (err, result) => {
      if (err) throw err;

      res.redirect(`/?board=${boardName}&id=${result.insertId}`);
    });
});

router.post('/delete', (req,res) => {
  if (!req.session.user) return res.status(400).end();

  let articleId = req.query.id;
  let boardName = req.query.board;
  
  if (req.session.user.isAdmin) {
    db.query(`delete from articles where id = ?`, [articleId], err => {
      if (err) throw err;

      res.redirect(`/?board=${boardName}`);
    });

  } else {

    let userId = req.session.user.id;
    db.query(`delete from articles where id = ? and user_id = ?`, [articleId, userId], err => {
      if (err) throw err;

      res.redirect(`/?board=${boardName}`);
    });
  }
});

router.get('/update', (req,res) => {
  let articleId = req.query.id;
  db.query(`select * from articles where id = ?`, [articleId], (err, rows) => {
    if (err) throw err;

    let article = rows[0];
    res.render('bbs/write', {article});
  });
});

router.post('/update', (req,res) => {
  if (!req.session.user) return res.status(400).end();

  let articleId = req.query.id;
  let boardName = req.query.board;
  let board = res.locals.boards.find(b => b.name == boardName);
  let user = req.session.user;
  let title = (req.body.title || '').trim();
  let content = (req.body.content || '').trim();

  if (!board || !user || !title || !content) return res.status(400).end();

  if (req.session.user.isAdmin) {
    db.query(`update articles set title = ?, content = ? where id = ?`, [title, content, articleId], err => {
      if (err) throw err;

      res.redirect(`/?board=${boardName}&id=${articleId}`);
    });

  } else {

    let userId = req.session.user.id;
    db.query(`update articles set title = ?, content = ? where id = ? and user_id = ?`, [title, content, articleId, userId], err => {
      if (err) throw err;

      res.redirect(`/?board=${boardName}&id=${articleId}`);
    });
  }
});



/** comments **/
router.get('/comments', (req,res) => {
  let articleId = req.query.articleId;
  if (!articleId) return res.status(400).end();

  db.query(`select c.*, u.name author from comments c join users u on u.id = c.user_id where c.article_id = ?`, [articleId],
    (err, rows) => {
      if (err) throw err;

      res.json(rows);
    });
});

router.post('/comments', (req,res) => {
  let articleId = req.query.articleId;
  let content = (req.body.content || '').trim();
  let user = req.session.user;
  if (!user || !articleId || !content) return res.status(400).end();

  db.query(`insert into comments(user_id, article_id, content) values(?, ?, ?)`, [user.id, articleId, content],
    (err, result) => {
      if (err) throw err;

      db.query(`select c.*, u.name author from comments c join users u on u.id = c.user_id where c.id = ?`, [result.insertId],
        (err, rows) => {
          if (err) throw err;

          let comment = rows[0] || null;
          res.json(comment);
        });
    });
});

router.put('/comments/:id', (req,res) => {
  let commentId = req.params.id;
  let content = (req.body.content || '').trim();
  let user = req.session.user;
  if (!user || !content) return res.status(400).end();

  if (user.isAdmin) {
    db.query(`update comments set content = ? where id = ?`, [content, commentId],
      (err, result) => {
        if (err) throw err;
        if (result.affectedRows == 0) return res.status(500).end();

        db.query(`select * from comments where id = ?`, [commentId], (err, rows) => {
          if (err) throw err;          

          let comment = rows[0] || null;
          res.json(comment);
        });
      });
  } else {
    db.query(`update comments set content = ? where id = ? and user_id = ?`, [content, commentId, user.id],
      (err, result) => {
        if (err) throw err;
        if (result.affectedRows == 0) return res.status(500).end();

        db.query(`select * from comments where id = ?`, [commentId], (err, rows) => {
          if (err) throw err;          

          let comment = rows[0] || null;
          res.json(comment);
        });
      });
  }
});

router.delete('/comments/:id', (req,res) => {
  let commentId = req.params.id;
  let user = req.session.user;
  if (!user) return res.status(401).end();

  if (user.isAdmin) {
    db.query(`delete from comments where id = ?`, [commentId],
      (err, result) => {
        if (err) throw err;

        if (result.affectedRows > 0) res.end();
        else res.status(500).end();
      });
  } else {
    db.query(`delete from comments where id = ? and user_id = ?`, [commentId, user.id],
      (err, result) => {
        if (err) throw err;

        if (result.affectedRows > 0) res.end();
        else res.status(500).end();
      });
  }
});
