var express = require('express');
var router = express.Router();
import { TestModel } from './../utils/schema'
router.get('/api/test', async (req, res, next) => {
  const limit = req.query.limit || 10
  const offset = req.query.offset || 0
  const count = await TestModel.find().count()
  TestModel.find((err, result) => {
    res.send(err || {
      count: count,
      results: result
    })
  }).sort({ created_at: -1 }).skip(offset).limit(limit)
})
// 单
router.get('/api/test/:id', (req, res, next) => {
  TestModel.findById(req.params.id,
    (err, result) => {
      res.send(err || result)
    }
  );
})
// 增
router.post('/api/test', (req, res, next) => {
  const created_at = new Date()
  TestModel.create({
    ...req.body,
    created_at: created_at,
    updated_at: created_at
  },
    (err, result) => {
      res.send(err || result)
    }
  );
})
// 删
router.delete('/api/test', (req, res, next) => {
  TestModel.deleteOne({ _id: req.body.id },
    (err, result) => {
      res.send(err || result)
    }
  );
})
// 改
router.patch('/api/test/:id', (req, res, next) => {
  const updated_at = new Date()
  TestModel.updateOne({ _id: req.params.id }, {
    ...req.body,
    updated_at: updated_at
  },
    (err, result) => {
      res.send(err || result)
    }
  );
})

module.exports = router;