var express = require('express');
var router = express.Router();
import { UsersModel } from '../utils/schema'
// 查询参数是否有用户名和密码
// 查询后台有该用户
// 匹配密码是否正确
// 密码加密
// 返回access
router.post('/api/login', async (req, res, next) => {
  if (!req.body.username) res.send({ message: '请输入用户名' })
  if (!req.body.password) res.send({ message: '请输入登录密码' })
  const count = await UsersModel.find({ username: { $eq: req.body.username } }).count()
  if (count < 1) res.send({ message: '账号不存在' })
})

module.exports = router;