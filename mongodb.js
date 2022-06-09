// const { MongoClient } = require("mongodb");
import mongoose from 'mongoose'
var url = "mongodb://0.0.0.0:27017/admin";
console.log('数据库连接中')
mongoose.connect(url, {
  user: "root",
  pass: "example"
});
mongoose.Promise = global.Promise;
// 取得默认连接
const db = mongoose.connection;
db.on("connected", function () {
  console.log("数据库连接成功")
});
// 将连接与错误事件绑定（以获得连接错误的提示）
db.on('error', console.error.bind(console, 'MongoDB 连接错误：'));
