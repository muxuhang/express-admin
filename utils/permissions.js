const jwt = require('jsonwebtoken')
const { UsersModel } = require('./schema')
/**
 * @author mxh
 * @description 登录验证
 * @param {*} req: 请求
 * @param {*} res: 响应
 * @param {*} next: 下一步
 */
const premissions = async (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '')
    const decoded = jwt.verify(token, 'test2022')
    const user = await UsersModel.findOne({
      _id: decoded.id,
      'tokens.token': token,
    })
    if (!user) {
      throw new Error()
    }
    req.user = user
    next()
  } catch (error) {
    console.log(error)
    res.status(401).send({ error: '权限不足' })
  }
}

module.exports = premissions
