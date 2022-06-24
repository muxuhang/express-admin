const jwt = require("jsonwebtoken");
const { UsersModel } = require("./schema");
// const User = require("../models/user");
// 可编辑，用户为管理员，用户修改的自己的信息，
// 非管理员不可删除，仅可编辑自己的信息 
const premissions = async (req, res, next) => {
  try {
    const token = req.header("Authorization").replace("Bearer ", "");
    const decoded = jwt.verify(token, "test2022");
    console.log(decoded);
    const user = await UsersModel.findOne({
      _id: decoded.id,
      "tokens.token": token,
    });
    if (!user) {
      throw new Error();
    }
    req.user = user;
    next();
  } catch (error) {
    console.log(error);
    res.status(401).send({ error: "权限不足" });
  }
};

module.exports = premissions;