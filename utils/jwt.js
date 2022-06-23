const jwt = require('jsonwebtoken')

const jwtKey = 'test2022' // token生成的密匙，根据自己需求定义

const jwtSign = (data) => { // token生成函数，有效时间为一个小时
  console.log('data', data);
  const token = jwt.sign(data, jwtKey, { expiresIn: 60 * 60 })
  return token
}

const jwtCheck = (req, res, next) => { // token验证函数
  const token = req.headers.token
  jwt.verify(token, jwtKey, (err, data) => {
    if (err) {
      res.status(401).send({ error: "token无效" });
    } else {
      req.jwtInfo = data
      next()
    }
  })
}

module.exports = {
  jwtSign,
  jwtCheck
}