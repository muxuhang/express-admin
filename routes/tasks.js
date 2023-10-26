var express = require('express');
var router = express.Router();
import { TasksModel } from '../utils/schema'
router.get('/api/tasks', async (req, res, next) => {
  const limit = req.query.limit || 10
  const offset = req.query.offset || 0
  const count = await TasksModel.find().count()
  console.log(count);
  TasksModel.find((err, result) => {
    res.send(err || {
      count: count,
      results: result
    })
  }).sort({ created_at: -1 }).skip(offset).limit(limit)
})
// 单
router.get('/api/tasks/:id', (req, res, next) => {
  TasksModel.findById(req.params.id,
    (err, result) => {
      res.send(err || result)
    }
  );
})
// 增
router.post('/api/tasks', (req, res, next) => {
  const created_at = new Date()
  TasksModel.create({
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
router.delete('/api/tasks', (req, res, next) => {
  TasksModel.deleteOne({ _id: req.body.id },
    (err, result) => {
      res.send(err || result)
    }
  );
})
// 改
router.patch('/api/tasks/:id', (req, res, next) => {
  const updated_at = new Date()
  TasksModel.updateOne({ _id: req.params.id }, {
    ...req.body,
    updated_at: updated_at
  },
    (err, result) => {
      res.send(err || result)
    }
  );
})

module.exports = router;