const Book = require('../models/Book')
const db = require('../db')
const _ = require('lodash')
const { debug } = require('../utils/constant')
// 判断是否存在
function exists(book) {
  const { title, author, publisher } = book
  const sql = `select * from book where title='${title}' and author='${author}' and publisher='${publisher}'`
  // console.log('sql', sql)
  return db.queryOne(sql)
}
// 存在时候移除电子书的方法
async function removeBook(book) {
  if (book) {
    book.reset()
    if (book.fileName) {
      const removeBookSql = `delete from book where fileName='${book.fileName}'`
      const removeContentsSql = `delete from contents where fileName='${book.fileName}'`
      await db.querySql(removeBookSql)
      await db.querySql(removeContentsSql)
    }
  }
}
// 电子书目录创建并插入数据库
async function insertContents(book) {
  let contents = book.getContents()
  if (contents && contents.length > 0) {
    for (let i = 0; i < contents.length; i++) {
      const content = contents[i]
      const _content = _.pick(content, [
        'text',
        'fileName',
        'id',
        'href',
        'order',
        'level',
        'label',
        'pid',
        'navId',
      ])
      await db.insert(_content, 'contents')
    }
  }
}
// 插入电子书到数据库
function insertBook(book) {
  return new Promise(async (resolve, reject) => {
    try {
      // instanceof 运算符用于检测构造函数的 prototype 属性是否出现在某个实例对象的原型链
      if (book instanceof Book) {
        // 判断电子书是否存在
        const result = await exists(book)
        if (result) {
          // 存在
          await removeBook(book)
          reject(new Error('该电子书已存在！'))
        } else {
          await db.insert(book.toDb(), 'book')
          await insertContents(book)
          resolve()
        }
      } else {
        reject(new Error('添加的图书对象不合法'))
      }
    } catch (e) {
      reject(e)
    }
  })
}

// 更新电子书信息
function updateBook(book) {
  return new Promise(async (resolve, reject) => {
    try {
      if (book instanceof Book) {
        const result = await getBook(book.fileName)
        if (result) {
          const model = book.toDb()
          if (+result.updateType === 0) {
            reject(new Error('该图书为内置图书，不能进行编辑！'))
          } else {
            await db.update(model, 'book', `where fileName='${book.fileName}'`)
            resolve()
          }
        }
      } else {
        reject(new Error('添加的图书对象不合法'))
      }
    } catch (e) {
      reject(e)
    }
  })
}
// 获取图书信息
function getBook(fileName) {
  return new Promise(async (resolve, reject) => {
    const bookSql = `select * from book where fileName='${fileName}'`
    const contentsSql = `select * from contents where fileName='${fileName}' order by \`order\``
    const book = await db.queryOne(bookSql)
    const contents = await db.querySql(contentsSql)
    if (book) {
      book.cover = Book.genCoverUrl(book)
      book.contentsTree = Book.genContentsTree(contents)
      resolve(book)
    } else {
      reject(new Error('电子书不存在！'))
    }
  })
}

// 获取分类信息
function getCategory() {
  return new Promise(async (resolve, reject) => {
    const sql = `select * from category order by category asc`
    const result = await db.querySql(sql)
    resolve(result)
  })
}

// 获取列表图书信息
async function getListBook(query) {
  // debug && console.log(query)
  const { author, category, title, page = 1, pageSize = 15, sort } = query
  const offset = (page - 1) * pageSize // 偏移量
  let booksql = `select * from book`
  let where = `where`
  author && (where = db.andLike(where, 'author', author))
  title && (where = db.andLike(where, 'title', title))
  category && (where = db.and(where, 'categoryText', category))
  if (where !== 'where') {
    booksql = `${booksql} ${where}`
  }
  if (sort) {
    const symbol = sort[0]
    const cloumn = sort.slice(1, sort.length)
    const order = symbol === '+' ? 'asc' : 'desc'
    booksql = `${booksql} order by \`${cloumn}\` ${order}`
  }
  let countSql = `select count(*) as count from book`
  if (where !== 'where') {
    countSql = `${countSql} ${where}`
  }
  const count = await db.querySql(countSql)
  booksql = `${booksql} limit ${pageSize} offset ${offset}`
  const list = await db.querySql(booksql)
  list.forEach((book) => {
    book.cover = Book.genCoverUrl(book)
  })
  return { list, count: count[0].count, page, pageSize }
}

// 删除电子书
async function deleteBook(fileName) {
  return new Promise(async (resolve, reject) => {
    let book = await getBook(fileName)
    if (book) {
      if (+book.updateType === 0) {
        reject(new Error('该图书为内置图书，不允许删除！'))
      } else {
        const bookObj = new Book(null, book)
        let sql = `delete  from book where fileName = '${fileName}'`
        db.querySql(sql).then(() => {
          bookObj.reset() // 删除该电子书的相关文件
          resolve()
        })
      }
    } else {
      reject(new Error('删除失败，电子书不存在！'))
    }
  })
}

function home() {
  const userSql = 'select count(*) as count from user'
  const bookSql = 'select count(*) as count from book'
  const shelfSql = 'select count(*) as count from shelf'
  const rankSql = 'select count(*) as count from rank'
  return Promise.all([
    db.querySql(userSql),
    db.querySql(bookSql),
    db.querySql(shelfSql),
    db.querySql(rankSql)
  ]).then(results => {
    const user = results[0][0].count
    const book = results[1][0].count
    const shelf = results[2][0].count
    const rank = results[3][0].count
    return { user, book, shelf, rank }
  })
}
module.exports = {
  insertBook,
  getBook,
  updateBook,
  getCategory,
  getListBook,
  deleteBook,
  home,
}
