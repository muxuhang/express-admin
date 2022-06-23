const jwt = require("jsonwebtoken");
const { UsersModel } = require("./schema");
// const User = require("../models/user");

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization").replace("Bearer ", "");
    const decoded = jwt.verify(token, "test2022");
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
    res.status(401).send({ error: "请先登录" });
  }
};

module.exports = auth;