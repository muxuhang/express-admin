var express = require('express');
var router = express.Router();
import { UsersModel } from '../utils/schema'
import bcrypt from "bcrypt";
import { jwtSign } from '../utils/jwt';
// 查询参数是否有用户名和密码
// 查询后台有该用户
// 匹配密码是否正确
// 密码加密
// 返回access
router.post('/api/login', async (req, res, next) => {
  if (!req.body.username) res.status(400).send({ message: '请输入用户名' })
  if (!req.body.password) res.status(400).send({ message: '请输入登录密码' })
  const count = await UsersModel.find({ username: { $eq: req.body.username } }).count()
  if (count < 1) res.status(400).send({ message: '账号不存在' })
  else {
    UsersModel.find({ username: { $eq: req.body.username } }, (err, result) => {
      if (err) {
        res.status(400).send(err)
      } else {
        bcrypt.compare(
          req.body.password,
          result[0].password
        ).then((r) => {
          if (r) {
            const token = jwtSign({ id: result[0]._id })
            res.send({ access: token })
          } else {
            res.status(400).send({ message: '密码错误' })
          }
        });
      }
    })
  }
})

module.exports = router;