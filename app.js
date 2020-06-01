const express = require('express')
//全局路由
const router = require('./router')
const fs = require('fs')
const https = require('https')
// 对post请求的请求体进行解析
const bodyParser = require('body-parser')
// 跨域中间件
const cors = require('cors')


// 创建 express 应用
const app = express()
app.use(cors())
// app.use(bodyParser.urlencoded({ extended: true }))
// app.use(bodyParser.json())

app.use(bodyParser.json({limit: '10mb', extended: true}))
app.use(bodyParser.urlencoded({limit: '10mb', extended: true}))

app.use('/', router)

// https服务器设置
const privateKey = fs.readFileSync('./https/3688733_ebook.poetrycode.top.key', 'utf8')
const certificate = fs.readFileSync('./https/3688733_ebook.poetrycode.top.pem', 'utf8')
const credentials = { key: privateKey, cert: certificate }
const httpsServer = https.createServer(credentials, app)
const SSLPORT = 18082


// 使 express 监听 5000 端口号发起的 http 请求
// const server = app.listen(5000, function () {
//   const {
//     address,
//     port
//   } = server.address()
//   console.log('Http服务已启动 http://%s:%s', address, port)
// })

httpsServer.listen(SSLPORT, function() {
  console.log('HTTPS Server is running on: https://localhost:%s', SSLPORT)
})