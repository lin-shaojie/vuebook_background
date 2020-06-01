// 用于验证指定http请求的JsonWebTokens的有效性
const expressJwt = require('express-jwt')
const { PRIVATE_KEY } = require('../utils/constant')

const jwtAuth = expressJwt({
  secret: PRIVATE_KEY, //  签名的密钥 或 PublicKey
  credentialsRequired: true, // 设置为false就不进行校验了，游客也可以访问
}).unless({
  path: [
    '/',
    '/user/login',
    //jwt的白名单，在该名单内说明不会进行校验
  ],
})

module.exports = jwtAuth
