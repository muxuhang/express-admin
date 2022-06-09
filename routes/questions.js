var express = require('express');
var router = express.Router();
import auth from '../utils/auth';
import { QuestionsModel } from '../utils/schema'
// 试题
router.get('/questions',auth, async (req, res, next) => {
  const limit = req.query.limit || 10
  const offset = req.query.offset || 0
  const count = await QuestionsModel.find().count()
  QuestionsModel.find((err, result) => {
    res.send(err || {
      count: count,
      results: result
    })
  }).sort({ created_at: -1 }).skip(offset).limit(limit)
})
// 单个试题
router.get('/question', (req, res, next) => {
  QuestionsModel.findById(req.body.id,
    (err, result) => {
      res.send(err || result)
    }
  );
})
// 增
router.post('/questions', (req, res, next) => {
  const created_at = new Date()
  QuestionsModel.create({
    ...req.body,
    created_at: created_at
  },
    (err, result) => {
      res.send(err || result)
    }
  );
})
// 删
router.delete('/questions', (req, res, next) => {
  QuestionsModel.deleteOne({ _id: req.body.id },
    (err, result) => {
      res.send(err || result)
    }
  );
})
// 改
router.post('/questions/update', (req, res, next) => {
  QuestionsModel.updateOne({ _id: req.body._id }, req.body,
    (err, result) => {
      res.send(err || result)
    }
  );
})

module.exports = router;