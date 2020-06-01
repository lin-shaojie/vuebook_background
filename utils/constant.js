const { env } = require('./env')
const UPLOAD_PATH =
  env === 'dev'
    ? 'D:/nginx-1.16.1/lin/upload/admin-upload-ebook'
    : '/www/wwwroot/ebook.poetrycode.top/admin-upload-ebook'

const OLD_UPLOAD_URL =
  env === 'dev'
    ? 'https://ebook.poetrycode.top:4430/book/res/img'
    : 'https://ebook.poetrycode.top/book/res/img'

const UPLOAD_URL =
  env === 'dev'
    ? 'https://ebook.poetrycode.top:4430/admin-upload-ebook'
    : 'https://ebook.poetrycode.top/admin-upload-ebook'
module.exports = {
  // 一些常用的常量
  CODE_ERROR: -1,
  CODE_SUCCESS: 0,
  CODE_TOKEN_EXPIRED: -2,
  debug: true,
  PWD_SALT: 'admin_imooc_node', //md5+salt密钥
  PRIVATE_KEY: 'admin_ebookstore_node_poetrycode',
  JWT_EXPIRED: 60 * 60, // jwt 失效时间,
  UPLOAD_PATH,
  TYPE_EPUB: 'application/epub+zip',
  UPLOAD_URL,
  OLD_UPLOAD_URL,
}
