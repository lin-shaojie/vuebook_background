const express = require('express')
const { UPLOAD_PATH } = require('../utils/constant')
// 文件上传
const multer = require('multer')
const Result = require('../models/Result')
const Book = require('../models/Book')
const boom = require('boom')
const { decoded } = require('../utils')
const bookService = require('../servies/book')
const router = express.Router()

router.post(
  '/upload',
  // dest为上传的目标目录，single表示上传单个文件，同时req中添加该文件。
  multer({ dest: `${UPLOAD_PATH}/book` }).single('file'),
  function (req, res, next) {
    // req.file为一个数组
    if (!req.file || req.file.length === 0) {
      // 如果不存在，上传失败
      new Result('上传电子书失败！').fail(res)
    } else {
      const book = new Book(req.file)
      book
        .parse()
        .then((book) => {
          // console.log('book', book)
          // 上传成功
          new Result(book, '上传电子书成功！').success(res)
        })
        .catch((error) => {
          next(boom.badImplementation(error))
        })
    }
  }
)
// 新增电子书
router.post('/create', function (req, res, next) {
  const decode = decoded(req)
  if (decode && decode.username) {
    req.body.username = decode.username
  }
  const book = new Book(null, req.body)
  // console.log(book)
  bookService
    .insertBook(book)
    .then(() => {
      new Result('添加电子书成功！').success(res)
    })
    .catch((err) => {
      next(boom.badRequest(err))
    })
})

// 更新电子书信息
router.post('/update', function (req, res, next) {
  const decode = decoded(req)
  if (decode && decode.username) {
    req.body.username = decode.username
  }
  const book = new Book(null, req.body)
  bookService
    .updateBook(book)
    .then(() => {
      new Result('更新电子书成功！').success(res)
    })
    .catch((err) => {
      next(boom.badRequest(err))
    })
})

// 获取电子书信息
router.get('/get', function (req, res, next) {
  const { fileName } = req.query
  if (!fileName) {
    next(boom.badRequest(new Error('请求参数 fileName 不能为空！')))
  } else {
    bookService
      .getBook(fileName)
      .then((book) => {
        new Result(book, '获取图书信息成功！').success(res)
      })
      .catch((err) => {
        next(boom.badImplementation(err))
      })
  }
})

// 获取分类信息
router.get('/category', function (req, res, next) {
  bookService
    .getCategory()
    .then((category) => {
      new Result(category, '获取分类信息成功！').success(res)
    })
    .catch((err) => {
      next(boom.badImplementation(err))
    })
})

router.get('/list', function (req, res, next) {
  bookService
    .getListBook(req.query)
    .then(({ list, count, page, pageSize }) => {
      new Result(
        { list, count: +count, page: +page, pageSize: +pageSize },
        '获取电子书列表信息成功！'
      ).success(res)
    })
    .catch((err) => {
      boom.badImplementation(err)
    })
})

router.get('/delete', function (req, res, next) {
  const { fileName } = req.query
  if (!fileName) {
    next(boom.badRequest(new Error('请求参数 fileName 不能为空！')))
  } else {
    bookService
      .deleteBook(fileName)
      .then(() => {
        new Result('删除电子书成功！').success(res)
      })
      .catch((err) => {
        next(boom.badImplementation(err))
      })
  }
})

router.get('/home', function (req, res, next) {
  bookService
    .home()
    .then((result) => {
      new Result(result, '获取首页信息成功').success(res)
    })
    .catch((err) => {
      next(boom.badImplementation(err))
    })
})
module.exports = router
