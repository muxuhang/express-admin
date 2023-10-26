var express = require('express');
var router = express.Router();
import { DemoModel } from '../utils/schema'
router.get('/api/demo', async (req, res, next) => {
  const limit = req.query.limit || 10
  const offset = req.query.offset || 0
  const count = await DemoModel.find().count()
  DemoModel.find((err, result) => {
    res.send(err || {
      count: count,
      results: result
    })
  }).sort({ created_at: -1 }).skip(offset).limit(limit)
})
// 单
router.get('/api/demo/:id', (req, res, next) => {
  DemoModel.findById(req.params.id,
    (err, result) => {
      res.send(err || result)
    }
  );
})
// 增
router.post('/api/demo', (req, res, next) => {
  const created_at = new Date()
  DemoModel.create({
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
router.delete('/api/demo', (req, res, next) => {
  DemoModel.deleteOne({ _id: req.body.id },
    (err, result) => {
      res.send(err || result)
    }
  );
})
// 改
router.patch('/api/demo/:id', (req, res, next) => {
  const updated_at = new Date()
  DemoModel.updateOne({ _id: req.params.id }, {
    ...req.body,
    updated_at: updated_at
  },
    (err, result) => {
      res.send(err || result)
    }
  );
})

module.exports = router;