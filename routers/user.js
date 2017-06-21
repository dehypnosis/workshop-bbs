const express = require('express');
const router = express.Router();
module.exports = router;

const db = require('../db');

// user home
router.get('/', (req,res) => {
  res.redirect('/user/login');
});

// user login view
router.get('/login', (req,res) => {
  if (req.session.user) return res.redirect('/');

  res.render('user/login');
});

// user login
router.post('/login', (req,res) => {
  db.query('select * from users where uid like ? and password like ?',
    [req.body.uid, req.body.password],
    (err, rows) => {
      if (err) throw err;
      
      let user = rows[0];
      if (user) {
        req.session.user = user;
        res.redirect('/');
      } else {
        res.render('user/login', {
          forms: {
            login: {
              values: {uid: req.body.uid},
              errors: [{message: '로그인 정보가 바르지 않습니다.'}]
            }
          }
        });
      }
    });
});

router.post('/logout', (req,res) => {
  req.session.user = null;
  res.redirect('/user');
});

router.get('/join', (req,res) => {
  if (req.session.user) return res.redirect('/');

  res.render('user/join');
});

router.post('/join', (req,res) => {
  let values = req.body;
  let errors = [];

  // validate
  if (!values.uid || values.uid.trim().length == 0)
    errors.push({field:'uid', message: '아이디 입력해!'});

  if (!values.name || values.name.trim().length == 0)
    errors.push({field:'name', message: '이름 입력해!'});

  if (!values.password || values.password.trim().length == 0)
    errors.push({field:'password', message: '패스워드 입력해!'});
  
  if (values.password != values.password_confirm)
    errors.push({field:'password_confirm', message: '패스워드 틀렸어!'});

  if (errors.length > 0) {
    delete values.password;
    delete values.password_confirm;
    res.render('user/join', {
      forms: {
        join: {values, errors}
      }
    });
  }

  db.query('insert into users (uid, name, password) values (?, ?, ?)',
      [values.uid, values.name, values.password],
      (err, data) => {
        if (err) {
          switch(err.code) {
            case 'ER_DUP_ENTRY':
              errors.push({field: 'uid', message: '중복되는 아이디입니다.'});
            break;
            default:
              errors.push({message: '알 수 없는 오류입니다.'});
          }

          delete values.password;
          delete values.password_confirm;
          res.render('user/join', {
            forms: {
              join: {values, errors}
            }
          });
        } else {
          db.query('select * from users where id = ?', [data.insertId], (err, rows) => {
            if (err) return res.redirect('/');

            let user = rows[0];
            req.session.user = user;
            res.redirect('/');
          });
        }
      });
});

