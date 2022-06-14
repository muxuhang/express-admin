import mongoose from 'mongoose'

var Schema = mongoose.Schema;

// blogs
var BlogsModelSchema = new Schema({
  title: String,
  createdAt: Date
});
const BlogsModel = mongoose.model('Blogs', BlogsModelSchema);
new BlogsModel()

// blogs
var QuestionsModelSchema = new Schema({
  question: String,
  question_type: String,
  options: Object,
  created_at: Date
});
const QuestionsModel = mongoose.model('Questions', QuestionsModelSchema);
new QuestionsModel()

// photos
var PhotosModelSchema = new Schema({
  title: String,
  file: Array,
  created_at: Date
});
const PhotosModel = mongoose.model('Photos', PhotosModelSchema);
new QuestionsModel()

// users
var UsersModelSchema = new Schema({
  username: String,
  nickname: String,
  telphone: String,
  email: String,
  password: String,
  updated_at: Date,
  last_login_at: Date,
  created_at: Date
});
const UsersModel = mongoose.model('Users', UsersModelSchema);
new UsersModel()

// tasks
var TasksModelSchema = new Schema({
  title: String,
  body: String,
  status: String,
  total: Number,
  complete: Number,
  expired: Date,
  receivers: Array,
  updated_at: Date,
  created_at: Date
});
const TasksModel = mongoose.model('Tasks', TasksModelSchema);
new TasksModel()

// orgs
var OrgsModelSchema = new Schema({
  title: String,
  body: String,
  status: String,
  total: Number,
  complete: Number,
  expired: Date,
  receivers: Array,
  updated_at: Date,
  created_at: Date
});
const OrgsModel = mongoose.model('Orgs', OrgsModelSchema);
new OrgsModel()

// flatpages
var FlatpagesModelSchema = new Schema({
  title: String,
  slug: String,
  body: String,
  updated_at: Date,
  created_at: Date
});
const FlatpagesModel = mongoose.model('Flatpages', FlatpagesModelSchema);
new FlatpagesModel()

// test
var TestModelSchema = new Schema({
  title: String,
  updated_at: Date,
  created_at: Date
});
const TestModel = mongoose.model('Test', TestModelSchema);
new TestModel()

export {
  BlogsModel,
  QuestionsModel,
  PhotosModel,
  UsersModel,
  TasksModel,
  OrgsModel,
  FlatpagesModel,
  TestModel,
  // insert
}