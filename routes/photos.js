var express = require('express');
var router = express.Router();
import { PhotosModel } from './../utils/schema'
router.get('/api/photos', async (req, res, next) => {
  const limit = req.query.limit || 10
  const offset = req.query.offset || 0
  const count = await PhotosModel.find().count()
  PhotosModel.find((err, result) => {
    res.send(err || {
      count: count,
      results: result
    })
  }).sort({ created_at: -1 }).skip(offset).limit(limit)
})
// 单
router.get('/api/photo', (req, res, next) => {
  PhotosModel.findById(req.body.id,
    (err, result) => {
      res.send(err || result)
    }
  );
})
// 增
router.post('/api/photos', (req, res, next) => {
  const created_at = new Date()
  PhotosModel.create({
    ...req.body,
    created_at: created_at
  },
    (err, result) => {
      res.send(err || result)
    }
  );
})
// 删
router.delete('/api/photos', (req, res, next) => {
  PhotosModel.deleteOne({ _id: req.body.id },
    (err, result) => {
      res.send(err || result)
    }
  );
})
// 改
router.post('/api/photos', (req, res, next) => {
  PhotosModel.updateOne({ _id: req.body._id }, req.body,
    (err, result) => {
      if (err) return (err);
      res.send(err || result)
    }
  );
})

module.exports = router;