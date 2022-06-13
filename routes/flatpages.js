var express = require('express');
var router = express.Router();
import { FlatpagesModel } from '../utils/schema'
router.get('/api/flatpages', async (req, res, next) => {
  const limit = req.query.limit || 10
  const offset = req.query.offset || 0
  const count = await FlatpagesModel.find().count()
  FlatpagesModel.find((err, result) => {
    res.send(err || {
      count: count,
      results: result
    })
  }).sort({ created_at: -1 }).skip(offset).limit(limit)
})
// 单
router.get('/api/flatpages/:id', (req, res, next) => {
  FlatpagesModel.findById(req.params.id,
    (err, result) => {
      res.send(err || result)
    }
  );
})
// 增
router.post('/api/flatpages', (req, res, next) => {
  const created_at = new Date()
  FlatpagesModel.create({
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
router.delete('/api/flatpages', (req, res, next) => {
  FlatpagesModel.deleteOne({ _id: req.body.id },
    (err, result) => {
      res.send(err || result)
    }
  );
})
// 改
router.patch('/api/flatpages/:id', (req, res, next) => {
  const updated_at = new Date()
  FlatpagesModel.updateOne({ _id: req.params.id }, {
    ...req.body,
    updated_at: updated_at
  },
    (err, result) => {
      res.send(err || result)
    }
  );
})

module.exports = router;