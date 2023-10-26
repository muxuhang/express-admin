var express = require('express');
var router = express.Router();
import { UsersModel } from '../utils/schema'
import bcrypt from "bcrypt";
router.post('/api/login', async (req, res, next) => {
  const { username, password } = req.body
  const hashPwd = bcrypt.hashSync(password, 10)
  const count = await UsersModel.create({
    username, password: hashPwd
  }, (err, result) => {
    console.log(err, result);
    if (err) {

    } else {
      res.send({ message: '账号不存在' })
    }
  })
})

module.exports = router;