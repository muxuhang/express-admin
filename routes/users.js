var express = require('express');
var router = express.Router();
import { check, validationResult } from 'express-validator';
import { UsersModel } from './../utils/schema'
// 增删改查
// 用户名唯一
// 用户名不能为空
// 加密密码
const validaties = [
  check('username').isLength({ min: 1 }).withMessage('请输入用户名'),
  check('telphone').isMobilePhone().withMessage('请输入正确的手机号'),
  check('email').isEmail().withMessage('请输入正确的邮箱'),
]
router.get('/api/users', async (req, res, next) => {
  const limit = req.query.limit || 10
  const offset = req.query.offset || 0
  const search = req.query.search || ''
  const count = await UsersModel.find().count()
  UsersModel.find({
    $or: [
      { username: { $regex: search } },
      { nickname: { $regex: search } },
      { telphone: { $regex: search } },
      { email: { $regex: search } }
    ]
  }, (err, result) => {
    res.send(err || {
      count: count,
      results: result
    })
  }).sort({ created_at: -1 }).skip(offset).limit(limit)
})
// 单
router.get('/api/users/:id', (req, res, next) => {
  UsersModel.findById(req.params.id,
    (err, result) => {
      res.send(err || result)
    }
  );
})
// 增
router.post('/api/users', [
  ...validaties
], async (req, res, next) => {
  var errors = validationResult(req);
  console.log(errors.isEmpty());
  if (!errors.isEmpty()) {
    res.send({ message: errors.errors[0].msg })
  } else {
    const username = req.body.username
    const count = await UsersModel.find({ username: username }).count()
    if (count) {
      res.send({ message: '用户名已存在' })
    } else {
      const created_at = new Date()
      UsersModel.create({
        ...req.body,
        created_at: created_at,
        updated_at: created_at
      },
        (err, result) => {
          res.send(err || result)
        }
      );
    }
  }
})
// 删
router.delete('/api/users', (req, res, next) => {
  const ids = req.body.ids.split(',')
  UsersModel.deleteMany({ _id: { $in: ids } },
    (err, result) => {
      res.send(err || result)
    }
  );
})
// 改
router.patch('/api/users/:id', (req, res, next) => {
  const updated_at = new Date()
  UsersModel.updateOne({ _id: req.params.id }, {
    ...req.body,
    updated_at: updated_at
  },
    (err, result) => {
      res.send(err || result)
    }
  );
})

module.exports = router;