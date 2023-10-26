const jwt = require("jsonwebtoken");
const { UsersModel } = require("./schema");
// const User = require("../models/user");

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization").replace("Bearer ", "");
    const decoded = jwt.verify(token, "test2022");
    console.log(decoded);
    const currentTime = new Date()
    const expTime = new Date(decoded.exp * 1000)
    if (currentTime > expTime) {
      throw '需重新登录'
    } else {
      const user = await UsersModel.findOne({
        _id: decoded.id,
        "tokens.token": token,
      });
      if (!user) {
        throw new Error();
      }
      req.user = user;
      next();
    }

  } catch (error) {
    console.log(error);
    res.status(401).send({ error: "请先登录" });
  }
};

module.exports = auth;