var express = require('express');
var router = express.Router();
import { OrgsModel } from '../utils/schema'
router.get('/api/orgs', async (req, res, next) => {
  const limit = req.query.limit || 10
  const offset = req.query.offset || 0
  const count = await OrgsModel.find().count()
  OrgsModel.find((err, result) => {
    res.send(err || {
      count: count,
      results: result
    })
  }).sort({ created_at: -1 }).skip(offset).limit(limit)
})
// 单
router.get('/api/orgs/:id', (req, res, next) => {
  OrgsModel.findById(req.params.id,
    (err, result) => {
      res.send(err || result)
    }
  );
})
// 增
router.post('/api/orgs', (req, res, next) => {
  const created_at = new Date()
  OrgsModel.create({
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
router.delete('/api/orgs', (req, res, next) => {
  OrgsModel.deleteOne({ _id: req.body.id },
    (err, result) => {
      res.send(err || result)
    }
  );
})
// 改
router.patch('/api/orgs/:id', (req, res, next) => {
  const updated_at = new Date()
  OrgsModel.updateOne({ _id: req.params.id }, {
    ...req.body,
    updated_at: updated_at
  },
    (err, result) => {
      res.send(err || result)
    }
  );
})

module.exports = router;