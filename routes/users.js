var express = require('express');
var router = express.Router();
import { UsersModel } from './../utils/schema'
// 增删改查
// 用户名唯一
// 用户名不能为空
// 加密密码
router.get('/api/users', async (req, res, next) => {
  const limit = req.query.limit || 10
  const offset = req.query.offset || 0
  const count = await UsersModel.find().count()
  UsersModel.find((err, result) => {
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
router.post('/api/users', async (req, res, next) => {
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